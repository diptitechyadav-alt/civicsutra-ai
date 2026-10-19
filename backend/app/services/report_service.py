import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from database.db import query_all, query_one, execute_commit
from services.priority_service import calculate_priority_score
from services.ai_service import analyze_report_with_ai
from services.similarity_service import evaluate_duplicate_candidate

def create_report(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Complete Report Ingestion Pipeline:
    1. Validates required inputs.
    2. Generates deterministic reference ID.
    3. Triggers AI analysis & extracts structured evidence.
    4. Evaluates candidate duplicate matches.
    5. Saves report and logs audit entry.
    """
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    location = data.get("location") or {}

    if not title or not description:
        raise ValueError("Title and description are required fields.")

    lat_val = location.get("latitude")
    lon_val = location.get("longitude")
    try:
        lat = float(lat_val) if lat_val is not None and str(lat_val).strip() != "" else None
    except (ValueError, TypeError):
        lat = None
    try:
        lon = float(lon_val) if lon_val is not None and str(lon_val).strip() != "" else None
    except (ValueError, TypeError):
        lon = None

    address = location.get("address") or "Ward 14 Civic Zone"
    landmark = location.get("landmark")
    is_gps = bool(location.get("is_gps_verified", False))

    now = datetime.now().isoformat()
    count = len(query_all("SELECT id FROM reports;")) + 1
    ref_id = f"CS-2026-{1000 + count}"

    # 1. Trigger AI Analysis
    ai_result = analyze_report_with_ai(title, description, data.get("category"))
    final_category = data.get("category") or ai_result["predicted_category"]

    # 2. Multi-factor priority score calculation
    photos = [p for p in (data.get("photos") or []) if p and str(p).strip()]
    has_photo = len(photos) > 0
    priority_score = calculate_priority_score(
        final_category, 1, now, landmark, has_photo=has_photo
    )

    image_ref = photos[0] if photos else None

    # 3. Extract authenticated or provided citizen identity
    citizen_id = data.get("citizen_id") or data.get("citizenId") or "usr-citizen-01"
    citizen_name = data.get("citizen_name") or data.get("citizenName") or "Citizen"
    citizen_phone = data.get("citizen_phone") or data.get("citizenPhone") or ""

    # Insert report into database
    execute_commit("""
        INSERT INTO reports (
            id, public_reference_id, submitted_by, citizen_name, citizen_phone,
            title, description, category, latitude, longitude,
            human_readable_location, landmark, ward, city, is_gps_verified,
            image_reference, submission_timestamp, status, assigned_team,
            privacy_settings, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        ref_id, ref_id, citizen_id,
        citizen_name, citizen_phone,
        title, description, final_category, lat, lon,
        address, landmark, location.get("ward", "Ward 14"), location.get("city", "New Delhi"),
        1 if is_gps else 0, image_ref, now, "SUBMITTED", None, "STANDARD", now, now
    ))

    # 4. Save AI Analysis
    ai_id = f"ai-{ref_id}"
    execute_commit("""
        INSERT INTO ai_analysis (
            id, report_id, predicted_category, extracted_structured_details,
            model_provider, confidence_score, analysis_status, error_details, analyzed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        ai_id, ref_id, ai_result["predicted_category"],
        json.dumps(ai_result.get("structured_details", {})),
        ai_result["model_provider"], ai_result["confidence_score"],
        ai_result["status"], ai_result.get("error"), now
    ))

    # 5. Record Initial Status History
    execute_commit("""
        INSERT INTO status_history (
            id, report_id, cluster_id, previous_status, new_status,
            changed_by, actor_role, note, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (f"sh-{ref_id}-1", ref_id, None, None, "SUBMITTED", citizen_name, "CITIZEN", "Report submitted via CivicSutra AI portal.", now))

    # 6. Evaluate Duplicate Candidate Matches against existing reports
    existing_reports = query_all("SELECT * FROM reports WHERE id != ?;", (ref_id,))
    new_report_dict = {
        "id": ref_id,
        "title": title,
        "description": description,
        "category": final_category,
        "latitude": lat,
        "longitude": lon,
        "image_reference": image_ref
    }

    for other in existing_reports:
        dup = evaluate_duplicate_candidate(new_report_dict, dict(other))
        if dup:
            dup_id = f"dup-{ref_id}-{other['id']}"
            try:
                execute_commit("""
                    INSERT OR REPLACE INTO duplicate_suggestions (
                        id, source_report_id, candidate_report_id, location_similarity,
                        text_similarity, image_similarity, category_agreement, combined_score,
                        review_status, review_note, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    dup_id, ref_id, other["id"], dup["location_similarity"],
                    dup["text_similarity"], dup["image_similarity"],
                    1 if dup["category_agreement"] else 0, dup["combined_score"],
                    "PENDING_REVIEW", dup["explanation"], now
                ))
            except Exception as e:
                print(f"Warning inserting duplicate candidate: {e}")

    # 7. Audit log & notification
    execute_commit("""
        INSERT INTO audit_logs (
            id, actor_id, actor_name, actor_role, action, affected_entity, entity_id, timestamp, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        f"aud-{ref_id}", citizen_id,
        citizen_name, "CITIZEN", "CREATE_REPORT", "REPORT", ref_id, now,
        f"Citizen {citizen_name} filed report {ref_id} categorized as {final_category}."
    ))

    execute_commit("""
        INSERT INTO notifications (
            id, recipient_id, notification_type, report_id, title, message, read_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        f"notif-{ref_id}", citizen_id, "STATUS_UPDATE", ref_id,
        "Report Received Successfully",
        f"Your report {ref_id} has been logged and queued for administrative review.",
        0, now
    ))

    return {
        "success": True,
        "reference_id": ref_id,
        "report_id": ref_id,
        "category": final_category,
        "priority_score": priority_score,
        "ai_analysis": ai_result
    }

def get_reports_filtered(
    role: Optional[str] = None,
    user_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    is_public: bool = False
) -> List[Dict[str, Any]]:
    """Retrieves reports with role filtering, searching, and public privacy protection."""
    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    if user_id and role != "ADMIN":
        query += " AND submitted_by = ?"
        params.append(user_id)

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    if status and status != "all":
        query += " AND status = ?"
        params.append(status)

    if search:
        s = f"%{search.lower()}%"
        query += " AND (LOWER(id) LIKE ? OR LOWER(title) LIKE ? OR LOWER(human_readable_location) LIKE ?)"
        params.extend([s, s, s])

    query += " ORDER BY submission_timestamp DESC;"

    rows = query_all(query, tuple(params))
    return [format_report_dict(dict(r), is_public=is_public, include_timeline=False) for r in rows]

def format_report_dict(r: Dict[str, Any], is_public: bool = False, include_timeline: bool = False) -> Dict[str, Any]:
    """Helper that formats a report record with dual camelCase and snake_case properties."""
    c_link = query_one(
        "SELECT cluster_id FROM cluster_reports WHERE report_id = ? AND association_status = 'CONFIRMED';",
        (r["id"],)
    )
    cluster_id = c_link["cluster_id"] if c_link else None

    # Timeline entries
    timeline = []
    if include_timeline:
        timeline_rows = query_all("SELECT * FROM status_history WHERE report_id = ? ORDER BY timestamp ASC;", (r["id"],))
        timeline = [
            {
                "id": row["id"],
                "status": row["new_status"],
                "timestamp": row["timestamp"],
                "actor_name": row["changed_by"],
                "actorName": row["changed_by"],
                "actor_role": row["actor_role"],
                "actorRole": row["actor_role"],
                "note": row.get("note"),
                "is_public": True,
                "isPublic": True
            }
            for row in timeline_rows
        ]

    p_score = calculate_priority_score(
        r["category"],
        3 if cluster_id else 1,
        r["submission_timestamp"],
        r.get("landmark"),
        has_photo=bool(r.get("image_reference"))
    )

    priority_score_obj = {
        "totalScore": p_score["total_score"],
        "total_score": p_score["total_score"],
        "level": p_score["level"],
        "volumeFactor": p_score["volume_factor"],
        "volume_factor": p_score["volume_factor"],
        "severityFactor": p_score["severity_factor"],
        "severity_factor": p_score["severity_factor"],
        "vulnerabilityFactor": p_score["vulnerability_factor"],
        "vulnerability_factor": p_score["vulnerability_factor"],
        "stalenessFactor": p_score["staleness_factor"],
        "staleness_factor": p_score["staleness_factor"],
        "recurrenceFactor": p_score.get("recurrence_factor", 0),
        "recurrence_factor": p_score.get("recurrence_factor", 0),
        "evidenceFactor": p_score.get("evidence_factor", 5),
        "evidence_factor": p_score.get("evidence_factor", 5),
        "reasoning": p_score.get("reasoning", ""),
        "calculated_at": p_score.get("calculated_at")
    }

    ai_data = query_one("SELECT * FROM ai_analysis WHERE report_id = ?;", (r["id"],))
    ai_confidence = ai_data["confidence_score"] if ai_data else 90.0
    ai_cat = ai_data["predicted_category"] if ai_data else r["category"]

    photos = [r["image_reference"]] if r.get("image_reference") else []
    citizen_name = "Verified Citizen (Identity Protected)" if is_public else r.get("citizen_name", "Citizen")
    citizen_phone = None if is_public else r.get("citizen_phone")

    assigned_team = r.get("assigned_team")
    assigned_to_obj = None
    if assigned_team:
        assigned_to_obj = {
            "teamId": assigned_team,
            "teamName": assigned_team,
            "assigneeName": "Assigned Inspector",
            "assignedAt": r.get("updated_at", "")
        }

    location_obj = {
        "latitude": r["latitude"],
        "longitude": r["longitude"],
        "address": r.get("human_readable_location") or "Ward 14, New Delhi",
        "landmark": r.get("landmark"),
        "ward": r.get("ward", "Ward 14"),
        "city": r.get("city", "New Delhi"),
        "isGpsVerified": bool(r.get("is_gps_verified")),
        "is_gps_verified": bool(r.get("is_gps_verified"))
    }

    return {
        "id": r["id"],
        "publicReferenceId": r.get("public_reference_id") or r["id"],
        "public_reference_id": r.get("public_reference_id") or r["id"],
        "citizenId": "anonymized" if is_public else r.get("submitted_by", "usr-citizen-01"),
        "submitted_by": "anonymized" if is_public else r.get("submitted_by", "usr-citizen-01"),
        "citizenName": citizen_name,
        "citizen_name": citizen_name,
        "citizenPhone": citizen_phone,
        "citizen_phone": citizen_phone,
        "title": r["title"],
        "description": r["description"],
        "category": r["category"],
        "aiSuggestedCategory": ai_cat,
        "ai_suggested_category": ai_cat,
        "aiCategoryConfidence": ai_confidence,
        "ai_category_confidence": ai_confidence,
        "location": location_obj,
        "photos": photos,
        "submissionTimestamp": r["submission_timestamp"],
        "submission_timestamp": r["submission_timestamp"],
        "createdAt": r["created_at"],
        "created_at": r["created_at"],
        "updatedAt": r["updated_at"],
        "updated_at": r["updated_at"],
        "status": r["status"],
        "priorityScore": priority_score_obj,
        "priority_score": priority_score_obj,
        "clusterId": cluster_id,
        "cluster_id": cluster_id,
        "assignedTo": assigned_to_obj,
        "assigned_team": assigned_team,
        "timeline": timeline
    }

def get_report_by_id(report_id: str, is_public: bool = False) -> Optional[Dict[str, Any]]:
    r = query_one("SELECT * FROM reports WHERE id = ?;", (report_id,))
    if not r:
        return None
    return format_report_dict(dict(r), is_public=is_public, include_timeline=True)
