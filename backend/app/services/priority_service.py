from datetime import datetime
from typing import Dict, Any, Optional
from core.config import settings

def calculate_priority_score(
    category: str,
    related_reports_count: int,
    created_at_iso: str,
    landmark: Optional[str] = None,
    has_photo: bool = True,
    is_recurring: bool = False
) -> Dict[str, Any]:
    """
    Transparent Priority Scoring Engine.
    Combines 6 calibrated factors totaling 100 points:
      - Severity (30 pts)
      - Corroborating Report Volume (20 pts)
      - Sensitive Location / Public Impact (20 pts)
      - Unresolved Duration (15 pts)
      - Recurrence (10 pts)
      - Evidence Quality (5 pts)
    """
    # 1. Severity Factor (0 to 30)
    severity_map = {
        "pothole": 26,       # High physical vehicle/skid accident risk
        "waterlogging": 28,  # Dengue hazard / vehicle submergence
        "water_supply": 24,  # Resource loss / road base erosion
        "drainage": 22,      # Sanitation overflow
        "traffic": 22,       # Transit gridlock
        "garbage": 20,       # Sanitation vector
        "streetlight": 18,   # Night security
        "infrastructure": 16,
        "other": 14,
    }
    severity_factor = severity_map.get(category.lower(), 15)

    # 2. Corroborating Volume Factor (0 to 20 pts)
    # Logarithmic/bounded scaling so single reports don't dominate
    # 1 report = 6 pts; 2 = 12 pts; 3 = 16 pts; 4+ = 20 pts
    volume_factor = min(20, 6 + max(0, related_reports_count - 1) * 5)

    # 3. Location / Public Impact Factor (0 to 20 pts)
    lm = (landmark or "").lower()
    if any(k in lm for k in ["school", "hospital", "clinic", "dispensary", "metro", "bus", "station"]):
        vulnerability_factor = 20
    elif any(k in lm for k in ["market", "mandi", "temple", "bazaar"]):
        vulnerability_factor = 15
    else:
        vulnerability_factor = 8

    # 4. Unresolved Duration Factor (0 to 15 pts)
    try:
        created_dt = datetime.fromisoformat(created_at_iso.replace("Z", "+00:00"))
        delta_days = (datetime.now() - created_dt.replace(tzinfo=None)).total_seconds() / (24 * 3600)
        staleness_factor = min(15, int(delta_days * 3))
    except Exception:
        staleness_factor = 0

    # 5. Recurrence Factor (0 to 10 pts)
    recurrence_factor = 10 if is_recurring else 0

    # 6. Evidence Quality Factor (0 to 5 pts)
    evidence_factor = 5 if has_photo else 2

    total_score = min(
        100,
        severity_factor
        + volume_factor
        + vulnerability_factor
        + staleness_factor
        + recurrence_factor
        + evidence_factor,
    )

    if total_score >= 80:
        level = "CRITICAL"
    elif total_score >= 65:
        level = "HIGH"
    elif total_score >= 45:
        level = "MEDIUM"
    else:
        level = "LOW"

    reasoning = (
        f"Score {total_score}/100: Hazard severity ({severity_factor}/30), "
        f"Corroborating reports ({volume_factor}/20), Facility impact ({vulnerability_factor}/20), "
        f"Pending duration ({staleness_factor}/15), Recurrence ({recurrence_factor}/10), "
        f"Evidence clarity ({evidence_factor}/5)."
    )

    return {
        "total_score": total_score,
        "level": level,
        "volume_factor": volume_factor,
        "severity_factor": severity_factor,
        "vulnerability_factor": vulnerability_factor,
        "staleness_factor": staleness_factor,
        "recurrence_factor": recurrence_factor,
        "evidence_factor": evidence_factor,
        "calculated_at": datetime.now().isoformat(),
        "reasoning": reasoning,
    }
