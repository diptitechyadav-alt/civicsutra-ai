from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
from database.db import query_all, query_one, execute_commit
from models.schemas import DuplicateReviewRequest
from services.report_service import get_report_by_id
from core.security import require_authorized_staff

router = APIRouter(prefix="/api/duplicates", tags=["Duplicate Detection Intelligence"])

@router.get("")
def list_duplicates():
    """Returns candidate duplicate pairs with enriched reports and AI similarity metrics."""
    dups = query_all("SELECT * FROM duplicate_suggestions ORDER BY combined_score DESC;")
    results = []

    for d in dups:
        r1 = get_report_by_id(d["source_report_id"])
        r2 = get_report_by_id(d["candidate_report_id"])

        results.append({
            "id": d["id"],
            "reportId": d["source_report_id"],
            "matchingReportId": d["candidate_report_id"],
            "overallConfidence": int(d["combined_score"]),
            "distanceMeters": int(d["location_similarity"]),
            "semanticSimilarity": int(d["text_similarity"]),
            "categoryMatch": bool(d["category_agreement"]),
            "imageSimilarity": int(d.get("image_similarity", 50.0)),
            "explanation": d.get("review_note") or f"{int(d['location_similarity'])}m separation; {int(d['text_similarity'])}% text similarity.",
            "status": d["review_status"],
            "report1": r1,
            "report2": r2
        })

    return results

@router.post("/review")
def review_duplicate_match(
    payload: DuplicateReviewRequest,
    current_user: Dict[str, Any] = Depends(require_authorized_staff)
):
    """
    Authorized human review of proposed duplicate candidates.
    Never assumes automatic merging without reviewer certification.
    """
    new_status = (
        "CONFIRMED_SAME_ISSUE" if payload.action == "CONFIRM_SAME" else "CONFIRMED_DIFFERENT_ISSUE"
    )

    actor_id = current_user.get("id", "usr-admin-01")
    actor_name = current_user.get("name") or payload.actor_name or "Staff Officer"
    actor_role = current_user.get("role") or "ADMIN"

    now = datetime.now().isoformat()
    execute_commit("""
        UPDATE duplicate_suggestions
        SET review_status = ?, review_note = ?, reviewer_id = ?
        WHERE (source_report_id = ? AND candidate_report_id = ?)
           OR (source_report_id = ? AND candidate_report_id = ?);
    """, (
        new_status,
        payload.reviewer_notes or f"Marked as {new_status} by {actor_name}.",
        actor_id,
        payload.report_id, payload.matching_report_id,
        payload.matching_report_id, payload.report_id
    ))

    cluster_id = None
    if payload.action == "CONFIRM_SAME":
        # 1. Update candidate report status
        execute_commit(
            "UPDATE reports SET status = 'DUPLICATE_FLAGGED', updated_at = ? WHERE id = ?;",
            (now, payload.matching_report_id)
        )

        # 2. Check cluster associations for both reports
        c1 = query_one(
            "SELECT cluster_id FROM cluster_reports WHERE report_id = ? AND association_status = 'CONFIRMED' LIMIT 1;",
            (payload.report_id,)
        )
        c2 = query_one(
            "SELECT cluster_id FROM cluster_reports WHERE report_id = ? AND association_status = 'CONFIRMED' LIMIT 1;",
            (payload.matching_report_id,)
        )

        if c1 and c2 and c1["cluster_id"] == c2["cluster_id"]:
            # Both reports are already in the exact same cluster: prevent duplicate clusters
            cluster_id = c1["cluster_id"]
        elif c1 or c2:
            # Associate the other report with the existing cluster
            cluster_id = c1["cluster_id"] if c1 else c2["cluster_id"]
            other_report_id = payload.matching_report_id if c1 else payload.report_id

            execute_commit("""
                INSERT OR REPLACE INTO cluster_reports (
                    cluster_id, report_id, association_status, reviewed_by, reviewed_at
                ) VALUES (?, ?, 'CONFIRMED', ?, ?);
            """, (cluster_id, other_report_id, actor_id, now))

            # Update report status to CLUSTERED
            execute_commit(
                "UPDATE reports SET status = 'CLUSTERED', updated_at = ? WHERE id = ? AND status != 'CLUSTERED';",
                (now, other_report_id)
            )

            # Recalculate cluster priority score and report count
            from services.clustering_service import calculate_priority_score
            import json
            members = query_all(
                "SELECT report_id FROM cluster_reports WHERE cluster_id = ? AND association_status = 'CONFIRMED';",
                (cluster_id,)
            )
            cluster_info = query_one("SELECT * FROM issue_clusters WHERE id = ?;", (cluster_id,))
            if cluster_info:
                new_priority = calculate_priority_score(
                    cluster_info["category"], len(members), now, cluster_info.get("landmark")
                )
                execute_commit("""
                    UPDATE issue_clusters
                    SET priority_score = ?, priority_factors = ?, updated_at = ?
                    WHERE id = ?;
                """, (new_priority["total_score"], json.dumps(new_priority), now, cluster_id))
        else:
            # Neither report is in a cluster yet - create a new cluster grouping both reports
            from services.clustering_service import create_issue_cluster
            new_cluster = create_issue_cluster(
                report_ids=[payload.report_id, payload.matching_report_id],
                reviewer_notes=payload.reviewer_notes or f"Formed cluster from duplicate confirmation by {actor_name}.",
                actor_name=actor_name
            )
            cluster_id = new_cluster.get("id")

    elif payload.action == "CONFIRM_DIFFERENT":
        # Keep as independent issue
        # If candidate was DUPLICATE_FLAGGED, restore it to UNDER_REVIEW
        execute_commit(
            "UPDATE reports SET status = 'UNDER_REVIEW', updated_at = ? WHERE id = ? AND status = 'DUPLICATE_FLAGGED';",
            (now, payload.matching_report_id)
        )

    # Record audit entry
    execute_commit("""
        INSERT INTO audit_logs (
            id, actor_id, actor_name, actor_role, action, affected_entity, entity_id, timestamp, details
        ) VALUES (?, ?, ?, ?, 'REVIEW_DUPLICATE', 'DUPLICATE', ?, ?, ?);
    """, (
        f"aud-dup-{int(datetime.now().timestamp() * 1000)}",
        actor_id, actor_name, actor_role,
        f"{payload.report_id}-{payload.matching_report_id}", now,
        f"Reviewer decided: {new_status}. Cluster: {cluster_id or 'None'}. Note: {payload.reviewer_notes or 'None'}"
    ))

    return {"success": True, "status": new_status, "cluster_id": cluster_id}
