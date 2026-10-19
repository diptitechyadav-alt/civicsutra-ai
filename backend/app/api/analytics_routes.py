from fastapi import APIRouter
from typing import Dict, Any
from database.db import query_all
from services.priority_service import calculate_priority_score

router = APIRouter(prefix="/api/analytics", tags=["Operational Analytics & Hotspots"])

@router.get("")
def get_analytics():
    """Returns database-derived KPI metrics, distribution statistics, and hotspot coordinates."""
    reports = query_all("SELECT * FROM reports;")
    clusters = query_all("SELECT * FROM issue_clusters;")
    dups = query_all("SELECT * FROM duplicate_suggestions WHERE review_status = 'PENDING_REVIEW';")

    total_reports = len(reports)
    unreviewed = sum(1 for r in reports if r["status"] in ["SUBMITTED", "UNDER_REVIEW"])
    in_progress = sum(1 for r in reports if r["status"] in ["IN_PROGRESS", "ASSIGNED"])
    resolved = sum(1 for r in reports if r["status"] == "RESOLVED")

    # Category distribution
    cat_counts: Dict[str, int] = {}
    status_counts: Dict[str, int] = {}
    hotspots = []
    critical_count = 0

    for r in reports:
        cat = r["category"]
        st = r["status"]
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        status_counts[st] = status_counts.get(st, 0) + 1

        p_score = calculate_priority_score(
            cat, 1, r["submission_timestamp"], r.get("landmark")
        )
        if p_score["level"] in ["CRITICAL", "HIGH"]:
            critical_count += 1

        hotspots.append({
            "id": r["id"],
            "title": r["title"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "category": cat,
            "priorityLevel": p_score["level"],
            "score": p_score["total_score"],
            "status": st
        })

    return {
        "kpis": {
            "totalReports": total_reports,
            "unreviewed": unreviewed,
            "inProgress": in_progress,
            "resolved": resolved,
            "criticalCount": critical_count,
            "activeClusters": len(clusters),
            "suspectedDuplicates": len(dups)
        },
        "categoryCounts": cat_counts,
        "statusCounts": status_counts,
        "hotspots": hotspots
    }
