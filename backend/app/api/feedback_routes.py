from fastapi import APIRouter, HTTPException
from datetime import datetime
from database.db import query_all, execute_commit
from models.schemas import FeedbackCreate

router = APIRouter(prefix="/api/feedback", tags=["Citizen Feedback & Quality"])

@router.post("", status_code=201)
def submit_feedback(payload: FeedbackCreate):
    """Logs citizen feedback regarding resolution quality."""
    now = datetime.now().isoformat()
    fb_id = f"fb-{int(datetime.now().timestamp() * 1000)}"

    execute_commit("""
        INSERT INTO feedback (id, report_reference, submitted_by, rating, comment, created_at)
        VALUES (?, ?, 'usr-citizen-01', ?, ?, ?);
    """, (fb_id, payload.report_reference, payload.rating, payload.comment, now))

    return {"success": True, "feedback_id": fb_id}

@router.get("/{report_id}")
def get_report_feedback(report_id: str):
    """Retrieves citizen feedback recorded for a report."""
    rows = query_all("SELECT * FROM feedback WHERE report_reference = ?;", (report_id,))
    return [dict(r) for r in rows]
