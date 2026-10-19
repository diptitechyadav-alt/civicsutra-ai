import math
from typing import List, Dict, Any, Tuple

def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Computes great-circle distance between two GPS coordinates in meters
    using the spherical Haversine formula.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance_meters = R * c
    return round(distance_meters, 1)

def detect_density_hotspots(
    reports: List[Dict[str, Any]], grid_size_meters: float = 200.0
) -> List[Dict[str, Any]]:
    """
    Identifies high-concentration spatial grid clusters across reported coordinates.
    Distinguishes high submission volume from high-severity verified hazards.
    """
    hotspots = []
    for r in reports:
        lat = r.get("latitude")
        lon = r.get("longitude")
        if lat is None or lon is None:
            continue

        # Count nearby reports within grid radius
        nearby_count = 0
        critical_count = 0
        for other in reports:
            o_lat = other.get("latitude")
            o_lon = other.get("longitude")
            if o_lat is None or o_lon is None:
                continue
            dist = calculate_haversine_distance(lat, lon, o_lat, o_lon)
            if dist <= grid_size_meters:
                nearby_count += 1
                if other.get("status") in ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"]:
                    critical_count += 1

        hotspots.append({
            "id": r["id"],
            "title": r["title"],
            "latitude": lat,
            "longitude": lon,
            "category": r["category"],
            "density_count": nearby_count,
            "unresolved_count": critical_count,
            "status": r.get("status", "SUBMITTED"),
            "cluster_id": r.get("cluster_id")
        })

    return hotspots
