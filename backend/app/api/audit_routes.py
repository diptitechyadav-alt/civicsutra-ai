from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from database.db import query_all
from core.security import require_admin

router = APIRouter(prefix="/api/audit", tags=["Tamper-Evident Audit Ledger"])

@router.get("")
def list_audit_logs(current_user: Dict[str, Any] = Depends(require_admin)):
    """Retrieves immutable audit history log of all administrative actions."""
    logs = query_all("SELECT * FROM audit_logs ORDER BY timestamp DESC;")
    return [
        {
            "id": l["id"],
            "timestamp": l["timestamp"],
            "actorId": l["actor_id"],
            "actorName": l["actor_name"],
            "actorRole": l["actor_role"],
            "action": l["action"],
            "targetType": l["affected_entity"],
            "targetId": l["entity_id"],
            "details": l.get("details")
        }
        for l in logs
    ]
