from fastapi import APIRouter, HTTPException, Query, Depends, Request, UploadFile, File
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import uuid
from pathlib import Path

from database.db import query_one, execute_commit
from models.schemas import ReportCreate, ReportUpdateStatus, ReportAssign
from services.report_service import create_report, get_reports_filtered, get_report_by_id
from services.status_service import validate_and_update_status
from core.security import get_optional_user, require_authorized_staff

router = APIRouter(prefix="/api/reports", tags=["Report Management & Ingestion"])

@router.get("")
def list_reports(
    role: Optional[str] = None,
    userId: Optional[str] = None,
    citizen_id: Optional[str] = None,
    citizenId: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    isPublic: Optional[bool] = False
):
    """Retrieves civic reports with role filtering and privacy protection."""
    effective_user_id = citizen_id or citizenId or userId
    return get_reports_filtered(
        role=role, user_id=effective_user_id, category=category,
        status=status, search=search, is_public=bool(isPublic)
    )

@router.get("/{report_id}")
def get_report(report_id: str, isPublic: Optional[bool] = False):
    """Retrieves detailed information and timeline for a single report."""
    report = get_report_by_id(report_id, is_public=bool(isPublic))
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    return report

@router.post("", status_code=201)
def submit_new_report(payload: ReportCreate, request: Request):
    """Ingests a new citizen grievance through the complete AI triage pipeline."""
    try:
        user = get_optional_user(request)
        data = payload.model_dump(by_alias=True)
        # If user is authenticated, guarantee their real verified credentials
        if user:
            data["citizen_id"] = user["id"]
            data["citizen_name"] = user["name"]
            if user.get("phone"):
                data["citizen_phone"] = user["phone"]

        result = create_report(data)
        created_report = get_report_by_id(result["reference_id"])
        return {
            "success": True,
            "report": created_report,
            "referenceId": result["reference_id"],
            "ai_analysis": result["ai_analysis"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal submission error: {str(e)}")

@router.post("/upload-image")
async def upload_report_image(file: UploadFile = File(...)):
    """Validates and persists uploaded complaint photographs with size and type checks."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only valid image files (JPEG, PNG, WebP) are accepted.")

    # Max size 5 MB
    MAX_FILE_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Photo size exceeds maximum allowed limit of 5MB.")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    filename = f"photo_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}{ext}"
    upload_dir = Path(__file__).resolve().parent.parent.parent / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "success": True,
        "url": f"/uploads/{filename}",
        "filename": filename,
        "size": len(content)
    }

@router.patch("/{report_id}/status")
def update_report_status(
    report_id: str,
    payload: ReportUpdateStatus,
    current_user: Dict[str, Any] = Depends(require_authorized_staff)
):
    """Enforces server-side validated status transition and records auditable history."""
    try:
        actor_name = current_user.get("name") or payload.actor_name or "Staff Officer"
        actor_role = current_user.get("role") or "ADMIN"

        res = validate_and_update_status(
            report_id=report_id,
            new_status=payload.status,
            actor_name=actor_name,
            actor_role=actor_role,
            note=payload.note
        )
        updated = get_report_by_id(report_id)
        return {"success": True, "report": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{report_id}/assign")
def assign_report_team(
    report_id: str,
    payload: ReportAssign,
    current_user: Dict[str, Any] = Depends(require_authorized_staff)
):
    """Assigns an issue to an authorized municipal maintenance department or field unit."""
    report = query_one("SELECT * FROM reports WHERE id = ?;", (report_id,))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    actor_id = current_user.get("id", "usr-admin-01")
    actor_name = current_user.get("name") or payload.actor_name or "Staff Officer"
    actor_role = current_user.get("role") or "ADMIN"

    now = datetime.now().isoformat()
    execute_commit(
        "UPDATE reports SET assigned_team = ?, status = 'ASSIGNED', updated_at = ? WHERE id = ?;",
        (payload.team_name, now, report_id)
    )

    # Record assignment
    asg_id = f"asg-{int(datetime.now().timestamp() * 1000)}"
    execute_commit("""
        INSERT INTO assignments (
            id, issue_reference, assigned_team, assignee_name, assignment_status, assigned_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?);
    """, (asg_id, report_id, payload.team_name, payload.assignee_name, now, now))

    # Add to status history
    execute_commit("""
        INSERT INTO status_history (
            id, report_id, cluster_id, previous_status, new_status, changed_by, actor_role, note, timestamp
        ) VALUES (?, ?, ?, ?, 'ASSIGNED', ?, ?, ?, ?);
    """, (
        f"sh-asg-{report_id}-{int(datetime.now().timestamp() * 1000)}",
        report_id, report.get("cluster_id"), report["status"],
        actor_name, actor_role,
        f"Assigned to {payload.team_name} (Lead: {payload.assignee_name or 'Duty Officer'}).",
        now
    ))

    # Add to audit log
    execute_commit("""
        INSERT INTO audit_logs (
            id, actor_id, actor_name, actor_role, action, affected_entity, entity_id, timestamp, details
        ) VALUES (?, ?, ?, ?, 'ASSIGN_TEAM', 'REPORT', ?, ?, ?);
    """, (
        f"aud-asg-{int(datetime.now().timestamp() * 1000)}",
        actor_id, actor_name, actor_role,
        report_id, now,
        f"Assigned report {report_id} to {payload.team_name}."
    ))

    updated = get_report_by_id(report_id)
    return {"success": True, "report": updated}
