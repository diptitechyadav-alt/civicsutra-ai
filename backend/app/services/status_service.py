from datetime import datetime
from typing import Optional, Dict, Any
from database.db import query_one, execute_commit

VALID_TRANSITIONS = {
    "SUBMITTED": {"UNDER_REVIEW", "DUPLICATE_FLAGGED", "CLUSTERED", "ASSIGNED", "REJECTED"},
    "UNDER_REVIEW": {"ASSIGNED", "IN_PROGRESS", "CLUSTERED", "DUPLICATE_FLAGGED", "REJECTED", "RESOLVED"},
    "DUPLICATE_FLAGGED": {"CLUSTERED", "REJECTED", "UNDER_REVIEW", "SUBMITTED"},
    "CLUSTERED": {"ASSIGNED", "IN_PROGRESS", "RESOLVED", "UNDER_REVIEW"},
    "ASSIGNED": {"IN_PROGRESS", "RESOLVED", "UNDER_REVIEW"},
    "IN_PROGRESS": {"RESOLVED", "ASSIGNED", "UNDER_REVIEW"},
    "RESOLVED": {"UNDER_REVIEW"}, # Re-open requires justification
    "REJECTED": {"UNDER_REVIEW"},
}

def validate_and_update_status(
    report_id: str,
    new_status: str,
    actor_name: str,
    actor_role: str,
    note: Optional[str] = None
) -> Dict[str, Any]:
    """
    Server-side validation for status transitions with audit logging.
    Prevents invalid or unauthorized status changes.
    """
    report = query_one("SELECT * FROM reports WHERE id = ?;", (report_id,))
    if not report:
        raise ValueError(f"Report {report_id} not found")

    current_status = report["status"]
    allowed = VALID_TRANSITIONS.get(current_status, set())

    if new_status not in allowed and new_status != current_status:
        raise ValueError(
            f"Invalid status transition from {current_status} to {new_status}. "
            f"Permitted next states: {', '.join(allowed)}"
        )

    now = datetime.now().isoformat()

    # Update report
    execute_commit(
        "UPDATE reports SET status = ?, updated_at = ? WHERE id = ?;",
        (new_status, now, report_id)
    )

    # Record in status_history
    history_id = f"sh-{report_id}-{int(datetime.now().timestamp() * 1000)}"
    execute_commit("""
        INSERT INTO status_history (
            id, report_id, cluster_id, previous_status, new_status,
            changed_by, actor_role, note, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (history_id, report_id, report.get("cluster_id"), current_status, new_status, actor_name, actor_role, note or f"Status changed to {new_status}", now))

    # Log in audit_logs
    audit_id = f"aud-{int(datetime.now().timestamp() * 1000)}"
    execute_commit("""
        INSERT INTO audit_logs (
            id, actor_id, actor_name, actor_role, action,
            affected_entity, entity_id, timestamp, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (audit_id, "usr-actor", actor_name, actor_role, "UPDATE_STATUS", "REPORT", report_id, now, f"Status updated from {current_status} to {new_status}. Note: {note or 'None'}"))

    # Create citizen notification
    notif_id = f"notif-{int(datetime.now().timestamp() * 1000)}"
    execute_commit("""
        INSERT INTO notifications (
            id, recipient_id, notification_type, report_id, title, message, read_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        notif_id, report["submitted_by"], "STATUS_UPDATE", report_id,
        f"Status Update: {new_status}",
        f"Your report {report_id} has been transitioned to {new_status}. {note or ''}",
        0, now
    ))

    return {
        "success": True,
        "previous_status": current_status,
        "new_status": new_status,
        "updated_at": now
    }
