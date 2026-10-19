import sys
from pathlib import Path

# Add backend and backend/app to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
APP_DIR = BASE_DIR / "app"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.geospatial_service import calculate_haversine_distance
from app.services.priority_service import calculate_priority_score
from app.services.similarity_service import calculate_semantic_similarity, evaluate_duplicate_candidate

client = TestClient(app)

def get_auth_headers(role: str = "ADMIN", email: str = None, password: str = None) -> dict:
    if email and password:
        resp = client.post("/api/auth/login", json={"email": email, "password": password})
    else:
        resp = client.post("/api/auth/login", json={"role": role})
    assert resp.status_code == 200, f"Login failed for role {role}: {resp.text}"
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}

import time

# 1. Citizen Registration with PBKDF2 Password Hashing
def test_citizen_registration():
    unique_email = f"citizen.test.{int(time.time() * 1000)}@example.com"
    reg_payload = {
        "name": "Sunita Rao",
        "email": unique_email,
        "password": "SecurePassword@123",
        "phone": "+91 98123 45678",
        "ward": "Ward 14 (South Zone)"
    }
    response = client.post("/api/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["name"] == "Sunita Rao"
    assert data["user"]["role"] == "CITIZEN"

# 2. Citizen Sign In With Valid Credentials
def test_citizen_login_valid():
    response = client.post("/api/auth/login", json={
        "email": "citizen@civicsutra.org",
        "password": "Citizen@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["role"] == "CITIZEN"
    assert "token" in data

# 3. Citizen Sign In With Invalid Password Rejected
def test_citizen_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "citizen@civicsutra.org",
        "password": "WrongPassword!999"
    })
    assert response.status_code == 401
    assert "Invalid password" in response.json()["detail"]

# 4. Admin Sign In With Valid Credentials
def test_admin_login_valid():
    response = client.post("/api/auth/login", json={
        "email": "admin@civicsutra.org",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["role"] == "ADMIN"
    assert "token" in data

# 5. Citizen Calling Admin Endpoint Is Blocked (403 Forbidden)
def test_citizen_forbidden_on_admin_endpoint():
    citizen_headers = get_auth_headers(role="CITIZEN")
    # Ordinary citizen attempts to create an issue cluster
    response = client.post(
        "/api/clusters",
        json={"title": "Citizen Unauthorized Cluster", "report_ids": ["CS-2026-1001"]},
        headers=citizen_headers
    )
    assert response.status_code == 403
    assert "Administrative privileges required" in response.json()["detail"]

# 6. Citizen Submitting Valid Report
def test_submit_valid_report():
    citizen_headers = get_auth_headers(role="CITIZEN")
    payload = {
        "title": "Large pothole in middle of road",
        "description": "Hazardous road cavity causing vehicles to brake suddenly on MG Road.",
        "category": "pothole",
        "location": {
            "latitude": 28.6141,
            "longitude": 77.2092,
            "address": "MG Road near Depot Gate 3",
            "landmark": "Depot Gate 3",
            "is_gps_verified": True
        },
        "photos": ["https://example.com/photo.jpg"]
    }
    response = client.post("/api/reports", json=payload, headers=citizen_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "CS-2026-" in data["referenceId"]
    assert data["report"]["category"] == "pothole"

# 7. Invalid or Missing Required Fields Rejected
def test_reject_invalid_report():
    payload = {
        "title": "",
        "description": "",
        "location": {"latitude": 28.61, "longitude": 77.20, "address": "Test"}
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code in [400, 422]

# 8. Report Submitted Without Images Accepted
def test_report_without_images():
    payload = {
        "title": "Overflowing waste dumpster near park",
        "description": "Solid waste overflowing from municipal bin onto footpath for 3 days.",
        "category": "garbage",
        "location": {"address": "Block C Community Park", "landmark": "Near Fountain"}
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    assert response.json()["report"]["photos"] == []

# 9. Report Persistence & Public Privacy Filter
def test_report_persistence():
    payload = {
        "title": "Streetlight outage causing dark stretch",
        "description": "Four streetlights continuously off along outer ring section.",
        "category": "streetlight",
        "location": {"address": "Ring Road Sector 4"},
        "citizenName": "Confidential Citizen",
        "citizenPhone": "+91 99999 11111"
    }
    create_res = client.post("/api/reports", json=payload)
    ref_id = create_res.json()["referenceId"]

    # Public View: citizen name and phone must be masked
    public_res = client.get(f"/api/reports/{ref_id}?isPublic=true")
    assert public_res.status_code == 200
    pub_data = public_res.json()
    assert "Identity Protected" in pub_data["citizenName"]
    assert pub_data["citizenPhone"] is None

# 10. AI Service Fallback Resilience
def test_ai_fallback_resilience():
    payload = {
        "title": "Broken storm water drain grate",
        "description": "Cast iron drain cover broken creating hazard for cyclists.",
        "category": "drainage",
        "location": {"address": "Service Lane 2"}
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "ai_analysis" in data
    assert data["ai_analysis"]["status"] in ["COMPLETED", "FALLBACK_RULE_BASED", "HEURISTIC"]

# 11. Duplicate Candidate Detection: Within 120m Same Defect
def test_duplicate_candidate_detection():
    rep1 = {
        "id": "R1",
        "title": "Deep dangerous pothole",
        "description": "Severe road cavity near metro pillar 45.",
        "category": "pothole",
        "latitude": 28.6139,
        "longitude": 77.2090
    }
    rep2 = {
        "id": "R2",
        "title": "Bad road crater",
        "description": "Gaddha near metro pillar 45 damaging car tyres.",
        "category": "pothole",
        "latitude": 28.6143, # approx 50m away
        "longitude": 77.2092
    }
    candidate = evaluate_duplicate_candidate(rep1, rep2)
    assert candidate is not None
    assert candidate["location_similarity"] < 120.0
    assert candidate["category_agreement"] is True
    assert candidate["combined_score"] > 40.0

# 12. Distant Reports Excluded (> 350m)
def test_distant_reports_not_duplicated():
    rep_near = {"id": "R1", "title": "Pothole", "description": "Road damage", "category": "pothole", "latitude": 28.6139, "longitude": 77.2090}
    rep_far = {"id": "R2", "title": "Pothole", "description": "Road damage", "category": "pothole", "latitude": 28.6250, "longitude": 77.2250} # > 1.5 km
    candidate = evaluate_duplicate_candidate(rep_near, rep_far)
    assert candidate is None

# 13. Nearby But Different Categories Not Merged
def test_nearby_different_categories_not_merged():
    rep_pothole = {"id": "R1", "title": "Pothole on street", "description": "Road crater", "category": "pothole", "latitude": 28.6139, "longitude": 77.2090}
    rep_light = {"id": "R2", "title": "Streetlight broken", "description": "Dark bulb", "category": "streetlight", "latitude": 28.6140, "longitude": 77.2091}
    candidate = evaluate_duplicate_candidate(rep_pothole, rep_light)
    assert candidate is None

# 14. Authorized Staff Can Confirm or Reject Suggested Match
def test_review_duplicate_action():
    admin_headers = get_auth_headers(role="ADMIN")
    review_payload = {
        "report_id": "CS-2026-1002",
        "matching_report_id": "CS-2026-1001",
        "action": "CONFIRM_SAME",
        "reviewer_notes": "Ground verification certifies single road defect."
    }
    response = client.post("/api/duplicates/review", json=review_payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "CONFIRMED_SAME_ISSUE"

# 15. Invalid Status Transition Rejected Server-Side
def test_reject_invalid_status_transition():
    admin_headers = get_auth_headers(role="ADMIN")
    update_invalid = {
        "status": "NON_EXISTENT_STATUS",
        "note": "Invalid status test"
    }
    response = client.patch("/api/reports/CS-2026-1001/status", json=update_invalid, headers=admin_headers)
    assert response.status_code == 422 # Pydantic enum validation

# 16. Cluster Membership Updates Correctly When Formed by Admin
def test_cluster_creation_and_membership():
    admin_headers = get_auth_headers(role="ADMIN")
    payload = {
        "title": "Ward 14 Emergency Test Cluster",
        "report_ids": ["CS-2026-1001", "CS-2026-1002"],
        "primary_category": "pothole"
    }
    response = client.post("/api/clusters", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["cluster"]["report_count"] == 2

# 17. Deterministic & Explainable Priority Scoring
def test_priority_score_calculation():
    score1 = calculate_priority_score("pothole", 3, "2026-10-10T10:00:00", "Metro Station")
    score2 = calculate_priority_score("pothole", 3, "2026-10-10T10:00:00", "Metro Station")
    assert score1["total_score"] == score2["total_score"]
    assert score1["level"] in ["HIGH", "CRITICAL"]
    assert "Hazard severity" in score1["reasoning"]

# 18. Status History Records Each Valid Change
def test_status_history_logging():
    admin_headers = get_auth_headers(role="ADMIN")
    res = client.patch(
        "/api/reports/CS-2026-1007/status",
        json={"status": "UNDER_REVIEW", "note": "Grievance officer started review."},
        headers=admin_headers
    )
    assert res.status_code == 200
    rep = client.get("/api/reports/CS-2026-1007").json()
    assert any(entry["status"] == "UNDER_REVIEW" for entry in rep["timeline"])

# 19. Citizen Data Isolation: Each Citizen Sees Only Their Own Reports
def test_citizen_complaint_isolation():
    # Citizen 1: usr-citizen-01
    rep1 = client.get("/api/reports?userId=usr-citizen-01&role=CITIZEN").json()
    # Citizen 2: usr-citizen-02 (Priya Patel)
    rep2 = client.get("/api/reports?userId=usr-citizen-02&role=CITIZEN").json()

    # The reports must not leak across citizen accounts
    ids_user1 = {r["id"] for r in rep1}
    ids_user2 = {r["id"] for r in rep2}

    assert len(ids_user1) > 0, "Citizen 1 should have reports"
    assert len(ids_user2) > 0, "Citizen 2 should have reports"
    assert ids_user1.isdisjoint(ids_user2), "Citizen 1 and Citizen 2 reports must be strictly isolated!"

# 20. Analytics Metrics Match Stored Records
def test_analytics_metrics_match_stored_records():
    res = client.get("/api/analytics").json()
    reports = client.get("/api/reports").json()
    assert res["kpis"]["totalReports"] == len(reports)
