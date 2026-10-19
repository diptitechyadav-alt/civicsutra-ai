from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from database.db import query_all, execute_commit

router = APIRouter(prefix="/api/notifications", tags=["In-App Citizen Notifications"])

@router.get("")
def get_user_notifications(userId: Optional[str] = "usr-citizen-01"):
    """Returns in-app notifications for the requested user."""
    notifs = query_all(
        "SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC;",
        (userId,)
    )
    return [
        {
            "id": n["id"],
            "userId": n["recipient_id"],
            "reportId": n.get("report_id"),
            "title": n["title"],
            "message": n["message"],
            "timestamp": n["created_at"],
            "read": bool(n["read_status"]),
            "type": n["notification_type"]
        }
        for n in notifs
    ]

@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: str):
    """Marks a notification item as read."""
    count = execute_commit(
        "UPDATE notifications SET read_status = 1 WHERE id = ?;", (notification_id,)
    )
    return {"success": count > 0}
