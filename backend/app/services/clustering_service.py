import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from database.db import query_all, query_one, execute_commit
from services.priority_service import calculate_priority_score

def get_all_clusters() -> List[Dict[str, Any]]:
    clusters = query_all("SELECT * FROM issue_clusters ORDER BY created_at DESC;")
    results = []
    for c in clusters:
        # Fetch member report IDs
        links = query_all("SELECT report_id FROM cluster_reports WHERE cluster_id = ? AND association_status = 'CONFIRMED';", (c["id"],))
        report_ids = [l["report_id"] for l in links]

        # Parse priority factors
        try:
            factors = json.loads(c.get("priority_factors") or "{}")
        except Exception:
            factors = {}

        priority_score_obj = {
            "totalScore": c["priority_score"],
            "total_score": c["priority_score"],
            "level": "CRITICAL" if c["priority_score"] >= 80 else ("HIGH" if c["priority_score"] >= 65 else "MEDIUM"),
            "volumeFactor": factors.get("volume_factor", 20),
            "volume_factor": factors.get("volume_factor", 20),
            "severityFactor": factors.get("severity_factor", 25),
            "severity_factor": factors.get("severity_factor", 25),
            "vulnerabilityFactor": factors.get("vulnerability_factor", 20),
            "vulnerability_factor": factors.get("vulnerability_factor", 20),
            "stalenessFactor": factors.get("staleness_factor", 10),
            "staleness_factor": factors.get("staleness_factor", 10),
            "recurrenceFactor": 0,
            "recurrence_factor": 0,
            "evidenceFactor": 5,
            "evidence_factor": 5,
            "calculated_at": c["updated_at"],
            "reasoning": factors.get("reasoning", "Multi-report municipal cluster.")
        }
        location_obj = {
            "latitude": c["representative_latitude"],
            "longitude": c["representative_longitude"],
            "address": c["representative_location"],
            "landmark": c.get("landmark"),
            "ward": "Ward 14",
            "city": "New Delhi",
            "isGpsVerified": True,
            "is_gps_verified": True
        }

        results.append({
            "id": c["id"],
            "title": c["title"],
            "category": c["category"],
            "primaryCategory": c["category"],
            "report_count": len(report_ids),
            "reportCount": len(report_ids),
            "report_ids": report_ids,
            "reportIds": report_ids,
            "center_location": location_obj,
            "centerLocation": location_obj,
            "cluster_status": c["cluster_status"],
            "status": c["cluster_status"],
            "priority_score": priority_score_obj,
            "priorityScore": priority_score_obj,
            "ai_confidence": 91,
            "aiConfidence": 91,
            "assigned_department": c.get("assigned_department"),
            "assignedDepartment": c.get("assigned_department"),
            "reviewer_notes": c.get("reviewer_notes"),
            "reviewerNotes": c.get("reviewer_notes"),
            "created_at": c["created_at"],
            "createdAt": c["created_at"],
            "updated_at": c["updated_at"],
            "updatedAt": c["updated_at"]
        })
    return results

def get_cluster_by_id(cluster_id: str) -> Optional[Dict[str, Any]]:
    from services.report_service import get_report_by_id as fetch_report_by_id
    cluster = query_one("SELECT * FROM issue_clusters WHERE id = ?;", (cluster_id,))
    if not cluster:
        return None

    links = query_all("SELECT report_id FROM cluster_reports WHERE cluster_id = ?;", (cluster_id,))
    report_ids = [l["report_id"] for l in links]

    reports = []
    for r_id in report_ids:
        r = fetch_report_by_id(r_id)
        if r:
            reports.append(r)

    # Format cluster using same dual property mapper
    clusters_all = get_all_clusters()
    c_formatted = next((c for c in clusters_all if c["id"] == cluster_id), dict(cluster))

    return {
        "cluster": c_formatted,
        "report_ids": report_ids,
        "reportIds": report_ids,
        "reports": reports
    }

def create_issue_cluster(
    report_ids: List[str],
    title: Optional[str] = None,
    primary_category: Optional[str] = None,
    reviewer_notes: Optional[str] = None,
    actor_name: str = "Dr. Rajesh Kumar"
) -> Dict[str, Any]:
    """Creates a new issue cluster grouping multiple reports."""
    if not report_ids:
        raise ValueError("At least one report required to form a cluster.")

    reports = [query_one("SELECT * FROM reports WHERE id = ?;", (rid,)) for rid in report_ids]
    reports = [r for r in reports if r]
    if not reports:
        raise ValueError("No valid reports found for the given IDs.")

    # Calculate average coordinates
    avg_lat = sum(r["latitude"] for r in reports) / len(reports)
    avg_lon = sum(r["longitude"] for r in reports) / len(reports)
    cat = primary_category or reports[0]["category"]
    addr = reports[0]["human_readable_location"]
    lmark = reports[0]["landmark"]

    count = len(query_all("SELECT id FROM issue_clusters;")) + 1
    cluster_id = f"CLUSTER-2026-0{count}"
    cluster_title = title or f"{cat.upper()} Hazard Cluster near {addr}"
    now = datetime.now().isoformat()

    priority = calculate_priority_score(cat, len(reports), now, lmark)

    execute_commit("""
        INSERT INTO issue_clusters (
            id, title, category, representative_latitude, representative_longitude,
            representative_location, landmark, cluster_status, priority_score,
            priority_factors, assigned_department, reviewer_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        cluster_id, cluster_title, cat, avg_lat, avg_lon, addr, lmark,
        "APPROVED", priority["total_score"], json.dumps(priority),
        "Roads & Infrastructure Maintenance Division",
        reviewer_notes or f"Manually verified and formed by {actor_name}.",
        now, now
    ))

    # Link reports in cluster_reports and update report status to CLUSTERED
    for r in reports:
        execute_commit("""
            INSERT OR REPLACE INTO cluster_reports (
                cluster_id, report_id, association_status, reviewed_by, reviewed_at
            ) VALUES (?, ?, 'CONFIRMED', 'usr-admin-01', ?);
        """, (cluster_id, r["id"], now))

        execute_commit("""
            UPDATE reports SET status = 'CLUSTERED', updated_at = ? WHERE id = ?;
        """, (now, r["id"]))

    # Record audit log
    execute_commit("""
        INSERT INTO audit_logs (
            id, actor_id, actor_name, actor_role, action, affected_entity, entity_id, timestamp, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        f"aud-{int(datetime.now().timestamp() * 1000)}",
        "usr-admin-01", actor_name, "ADMIN", "CREATE_CLUSTER", "CLUSTER", cluster_id, now,
        f"Formed cluster {cluster_id} associating {len(reports)} reports: {', '.join(report_ids)}"
    ))

    return {
        "id": cluster_id,
        "cluster_id": cluster_id,
        "title": cluster_title,
        "report_count": len(reports),
        "reportCount": len(reports),
        "primaryCategory": cat,
        "category": cat,
        "status": "APPROVED",
        "cluster_status": "APPROVED",
        "priority_score": priority,
        "priorityScore": {
            "totalScore": priority["total_score"],
            "total_score": priority["total_score"],
            "level": priority["level"],
            "volumeFactor": priority["volume_factor"],
            "severityFactor": priority["severity_factor"],
            "vulnerabilityFactor": priority["vulnerability_factor"],
            "stalenessFactor": priority["staleness_factor"],
            "reasoning": priority["reasoning"]
        }
    }
