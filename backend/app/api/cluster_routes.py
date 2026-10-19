from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from models.schemas import ClusterCreateRequest
from services.clustering_service import get_all_clusters, get_cluster_by_id, create_issue_cluster
from core.security import require_admin

router = APIRouter(prefix="/api/clusters", tags=["Issue Cluster Management"])

@router.get("")
def list_clusters():
    """Lists all active and approved issue clusters."""
    return get_all_clusters()

@router.get("/{cluster_id}")
def get_cluster(cluster_id: str):
    """Retrieves full cluster details with constituent reports."""
    cluster_data = get_cluster_by_id(cluster_id)
    if not cluster_data:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found")
    return cluster_data

@router.post("", status_code=201)
def create_cluster(
    payload: ClusterCreateRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """Forms a new issue cluster grouping multiple corroborated reports."""
    try:
        cluster = create_issue_cluster(
            report_ids=payload.report_ids,
            title=payload.title,
            primary_category=payload.primary_category,
            reviewer_notes=payload.reviewer_notes
        )
        return {"success": True, "cluster": cluster}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
