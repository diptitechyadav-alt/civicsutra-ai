import json
import sqlite3
from datetime import datetime, timedelta

def seed_database(conn: sqlite3.Connection):
    cursor = conn.cursor()
    now = datetime.now()
    two_days_ago = (now - timedelta(days=2)).isoformat()
    one_day_ago = (now - timedelta(days=1)).isoformat()
    three_hours_ago = (now - timedelta(hours=3)).isoformat()
    one_hour_ago = (now - timedelta(hours=1)).isoformat()

    from app.core.security import hash_password

    # 1. USERS
    citizen_hash = hash_password("Citizen@123")
    admin_hash = hash_password("Admin@123")
    field_hash = hash_password("Field@123")

    users = [
        ('usr-citizen-01', 'Aarav Sharma', 'citizen@civicsutra.org', 'CITIZEN', citizen_hash, '+91 98765 43210', 'en', two_days_ago, 'ACTIVE'),
        ('usr-citizen-02', 'Priya Patel', 'priya@civicsutra.org', 'CITIZEN', citizen_hash, '+91 98123 45678', 'en', two_days_ago, 'ACTIVE'),
        ('usr-admin-01', 'Dr. Rajesh Kumar', 'admin@civicsutra.org', 'ADMIN', admin_hash, '+91 98111 22334', 'en', two_days_ago, 'ACTIVE'),
        ('usr-field-01', 'Pooja Verma', 'field@civicsutra.org', 'FIELD_TEAM', field_hash, '+91 98222 33445', 'hi', two_days_ago, 'ACTIVE'),
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO users (id, name, email, role, password_hash, phone, preferred_language, created_at, account_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, users)

    # 2. REPORTS
    reports = [
        (
            'CS-2026-1001', 'CS-2026-1001', 'usr-citizen-01', 'Aarav Sharma', '+91 98765 43210',
            'Dangerous deep pothole near MG Road Bus Depot',
            'Extremely deep pothole spanning 1.5 meters on the right lane near MG Road Bus Depot. Multiple two-wheelers have skidded here during evening hours.',
            'pothole', 28.6139, 77.2090, 'MG Road, near Central Bus Depot Exit Gate', 'Central Bus Depot Gate 2',
            'Ward 14', 'New Delhi', 1,
            'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
            two_days_ago, 'CLUSTERED', 'Roads & Asphalt Maintenance', 'STANDARD', two_days_ago, one_day_ago
        ),
        (
            'CS-2026-1002', 'CS-2026-1002', 'usr-citizen-01', 'Sunita Mehra', '+91 98333 44556',
            'Large asphalt crater causing vehicle skids on MG Road',
            'Large broken road cavity about 45 meters from bus stand exit. Tar is completely washed out, exposing jagged stone aggregate.',
            'pothole', 28.6142, 77.2093, 'MG Road Northbound, 50m before Depot Gate', 'Bus Depot Metro Pillar 42',
            'Ward 14', 'New Delhi', 1,
            'https://images.unsplash.com/photo-1541888946425-d0fbb18086f7?w=600&auto=format&fit=crop&q=80',
            one_day_ago, 'CLUSTERED', 'Roads & Asphalt Maintenance', 'STANDARD', one_day_ago, one_day_ago
        ),
        (
            'CS-2026-1003', 'CS-2026-1003', 'usr-citizen-01', 'Vikram Joshi', '+91 98444 55667',
            'Deep road depression breaking car suspensions near depot',
            'Severe road depression on MG road opposite traffic light. Bumper damage reported by multiple autos and private cars today.',
            'pothole', 28.6140, 77.2091, 'MG Road, Adjacent to Depot Traffic Signal', 'Depot Traffic Signal',
            'Ward 14', 'New Delhi', 1,
            'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
            three_hours_ago, 'CLUSTERED', 'Roads & Asphalt Maintenance', 'STANDARD', three_hours_ago, three_hours_ago
        ),
        (
            'CS-2026-1004', 'CS-2026-1004', 'usr-citizen-01', 'Aarav Sharma', '+91 98765 43210',
            'Overflowing community garbage container near Mandi Gate',
            'Sanitation bin overflowing onto main pedestrian footpath for over 48 hours. Stray cattle and severe foul smell affecting market shoppers.',
            'garbage', 28.6180, 77.2150, 'Ward 14 Vegetable Mandi Road, Lane 3', 'Vegetable Mandi Main Gate',
            'Ward 14', 'New Delhi', 1,
            'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80',
            one_day_ago, 'ASSIGNED', 'Solid Waste Rapid Action Unit', 'STANDARD', one_day_ago, three_hours_ago
        ),
        (
            'CS-2026-1005', 'CS-2026-1005', 'usr-citizen-01', 'Deepak Rao', '+91 98666 77889',
            'Severe waterlogging under Northern Railway Underpass',
            'Rainwater accumulation over 2.5 feet under railway underpass. Small passenger vehicles cannot pass, causing heavy traffic backup.',
            'waterlogging', 28.6210, 77.2115, 'Underpass Road connecting Ward 14 to Sector 8', 'Northern Railway Bridge #14',
            'Ward 14', 'New Delhi', 1,
            'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
            three_hours_ago, 'IN_PROGRESS', 'Stormwater & Drainage Division', 'STANDARD', three_hours_ago, one_hour_ago
        ),
        (
            'CS-2026-1006', 'CS-2026-1006', 'usr-citizen-02', 'Priya Patel', '+91 98123 45678',
            'Dark stretch - 4 consecutive broken streetlights near Clinic',
            'Streetlights poles #12 to #15 have been non-functional for three nights. High security concern for women and hospital visitors walking late at night.',
            'streetlight', 28.6165, 77.2045, 'Subhash Marg, outside Primary Healthcare Center', 'Primary Healthcare Center',
            'Ward 14', 'New Delhi', 1,
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
            one_day_ago, 'UNDER_REVIEW', 'Street Lighting & Electrical Division', 'STANDARD', one_day_ago, one_day_ago
        ),
        (
            'CS-2026-1007', 'CS-2026-1007', 'usr-citizen-01', 'Ritu Sen', '+91 98777 88990',
            'Clean drinking water pipeline fracture gushing water',
            'Fresh municipal drinking water pipeline burst underneath roadside paver blocks. Thousands of liters of water being wasted and creating mud pool.',
            'water_supply', 28.6110, 77.2130, 'Road #4, Crossway Colony', 'Near Community School',
            'Ward 14', 'New Delhi', 1,
            'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
            one_hour_ago, 'SUBMITTED', 'Water Supply & Pipelines Cell', 'STANDARD', one_hour_ago, one_hour_ago
        ),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO reports (
            id, public_reference_id, submitted_by, citizen_name, citizen_phone,
            title, description, category, latitude, longitude,
            human_readable_location, landmark, ward, city, is_gps_verified,
            image_reference, submission_timestamp, status, assigned_team,
            privacy_settings, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, reports)

    # 3. AI ANALYSIS
    analyses = [
        (
            'ai-1001', 'CS-2026-1001', 'pothole',
            json.dumps({
                "summary": "Severe asphalt crater on primary transit road.",
                "severity": "CRITICAL",
                "traffic_impact": "High accident hazard for two-wheelers and buses.",
                "landmarks_identified": ["Central Bus Depot"],
                "missing_information": "Exact road depth measurement",
                "is_demo_analysis": True
            }),
            'demo-rule-based-nlp', 94.0, 'COMPLETED', None, two_days_ago
        ),
        (
            'ai-1002', 'CS-2026-1002', 'pothole',
            json.dumps({
                "summary": "Jagged stone tar fracture near depot entrance.",
                "severity": "HIGH",
                "traffic_impact": "Causes vehicle braking and skidding.",
                "landmarks_identified": ["Bus Stand Metro Pillar 42"],
                "is_demo_analysis": True
            }),
            'demo-rule-based-nlp', 92.0, 'COMPLETED', None, one_day_ago
        ),
        (
            'ai-1003', 'CS-2026-1003', 'pothole',
            json.dumps({
                "summary": "Deep road cavity near traffic light.",
                "severity": "HIGH",
                "traffic_impact": "Vehicle bumper damage reported.",
                "landmarks_identified": ["Depot Traffic Signal"],
                "is_demo_analysis": True
            }),
            'demo-rule-based-nlp', 89.0, 'COMPLETED', None, three_hours_ago
        ),
        (
            'ai-1004', 'CS-2026-1004', 'garbage',
            json.dumps({
                "summary": "Commercial market waste overflow spilling over footpath.",
                "severity": "MEDIUM",
                "traffic_impact": "Blocks pedestrian passage, health hazard.",
                "landmarks_identified": ["Vegetable Mandi Gate"],
                "is_demo_analysis": True
            }),
            'demo-rule-based-nlp', 96.0, 'COMPLETED', None, one_day_ago
        ),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO ai_analysis (
            id, report_id, predicted_category, extracted_structured_details,
            model_provider, confidence_score, analysis_status, error_details, analyzed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, analyses)

    # 4. DUPLICATE SUGGESTIONS
    dups = [
        (
            'dup-001', 'CS-2026-1002', 'CS-2026-1001',
            45.0, 82.0, 78.0, 1, 89.0,
            'CONFIRMED_SAME_ISSUE', 'usr-admin-01',
            '45m distance on MG Road; 82% semantic overlap regarding asphalt damage near Bus Depot; both categorized as Pothole.',
            one_day_ago
        ),
        (
            'dup-002', 'CS-2026-1003', 'CS-2026-1001',
            28.0, 76.0, 75.0, 1, 86.0,
            'CONFIRMED_SAME_ISSUE', 'usr-admin-01',
            '28m distance adjacent to Depot Signal; both describe deep vehicle hazard crater; candidate for joint work order.',
            three_hours_ago
        )
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO duplicate_suggestions (
            id, source_report_id, candidate_report_id, location_similarity,
            text_similarity, image_similarity, category_agreement, combined_score,
            review_status, reviewer_id, review_note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, dups)

    # 5. ISSUE CLUSTERS
    clusters = [
        (
            'CLUSTER-2026-01', 'MG Road Central Bus Depot Pothole Cluster',
            'pothole', 28.6140, 77.2091, 'MG Road, near Central Bus Depot Exit Gate & Signal',
            'Central Bus Depot Gate 2', 'APPROVED', 84,
            json.dumps({
                "volume_factor": 24, "severity_factor": 26,
                "vulnerability_factor": 24, "staleness_factor": 10,
                "reasoning": "Critical multi-report cluster (3 distinct citizen submissions within 45m radius on major transit corridor)."
            }),
            'Roads & Infrastructure Maintenance Division',
            'Verified spatial overlap and photographic evidence. Coordinated cold-mix patching batch for night shift.',
            one_day_ago, three_hours_ago
        )
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO issue_clusters (
            id, title, category, representative_latitude, representative_longitude,
            representative_location, landmark, cluster_status, priority_score,
            priority_factors, assigned_department, reviewer_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, clusters)

    # 6. CLUSTER REPORTS
    cluster_links = [
        ('CLUSTER-2026-01', 'CS-2026-1001', 'CONFIRMED', 'usr-admin-01', one_day_ago),
        ('CLUSTER-2026-01', 'CS-2026-1002', 'CONFIRMED', 'usr-admin-01', one_day_ago),
        ('CLUSTER-2026-01', 'CS-2026-1003', 'CONFIRMED', 'usr-admin-01', three_hours_ago),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO cluster_reports (
            cluster_id, report_id, association_status, reviewed_by, reviewed_at
        ) VALUES (?, ?, ?, ?, ?);
    """, cluster_links)

    # 7. STATUS HISTORY
    history = [
        ('sh-1001-1', 'CS-2026-1001', None, None, 'SUBMITTED', 'Aarav Sharma', 'CITIZEN', 'Report submitted via mobile portal.', two_days_ago),
        ('sh-1001-2', 'CS-2026-1001', None, 'SUBMITTED', 'UNDER_REVIEW', 'Dr. Rajesh Kumar', 'ADMIN', 'Grievance acknowledged. AI identified 2 nearby corroborating reports.', one_day_ago),
        ('sh-1001-3', 'CS-2026-1001', 'CLUSTER-2026-01', 'UNDER_REVIEW', 'CLUSTERED', 'Dr. Rajesh Kumar', 'ADMIN', 'Associated into Cluster CLUSTER-2026-01.', one_day_ago),
        ('sh-1004-1', 'CS-2026-1004', None, None, 'SUBMITTED', 'Aarav Sharma', 'CITIZEN', 'Report submitted.', one_day_ago),
        ('sh-1004-2', 'CS-2026-1004', None, 'SUBMITTED', 'ASSIGNED', 'Dr. Rajesh Kumar', 'ADMIN', 'Dispatched to Solid Waste Rapid Action Unit.', three_hours_ago),
        ('sh-1005-1', 'CS-2026-1005', None, None, 'SUBMITTED', 'Deepak Rao', 'CITIZEN', 'Report submitted.', three_hours_ago),
        ('sh-1005-2', 'CS-2026-1005', None, 'SUBMITTED', 'IN_PROGRESS', 'Pooja Verma', 'FIELD_TEAM', 'Portable de-watering pump deployed at site.', one_hour_ago),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO status_history (
            id, report_id, cluster_id, previous_status, new_status,
            changed_by, actor_role, note, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, history)

    # 8. ASSIGNMENTS
    assignments = [
        ('asg-001', 'CS-2026-1004', 'Solid Waste Rapid Action Unit', 'Pooja Verma', 'ACTIVE', three_hours_ago, three_hours_ago),
        ('asg-002', 'CS-2026-1005', 'Stormwater & Drainage Division', 'Pooja Verma', 'ACTIVE', one_hour_ago, one_hour_ago),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO assignments (
            id, issue_reference, assigned_team, assignee_name, assignment_status, assigned_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
    """, assignments)

    # 9. NOTIFICATIONS
    notifs = [
        ('notif-001', 'usr-citizen-01', 'CLUSTER_ASSOCIATION', 'CS-2026-1001',
         'Status Update: Report Grouped in Priority Cluster',
         'Your report CS-2026-1001 has been connected with 2 other community reports into Cluster CLUSTER-2026-01. Priority raised to Critical.',
         0, one_day_ago),
        ('notif-002', 'usr-citizen-01', 'STATUS_UPDATE', 'CS-2026-1004',
         'Action Update: Assigned to Field Team',
         'Your report regarding garbage overflow at Mandi Gate has been dispatched to Solid Waste Rapid Action Unit.',
         1, three_hours_ago),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO notifications (
            id, recipient_id, notification_type, report_id, title, message, read_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, notifs)

    # 10. AUDIT LOGS
    audits = [
        ('aud-001', 'usr-admin-01', 'Dr. Rajesh Kumar', 'ADMIN', 'APPROVE_CLUSTER', 'CLUSTER', 'CLUSTER-2026-01',
         one_day_ago, 'Approved AI suggested cluster linking reports CS-2026-1001, CS-2026-1002, and CS-2026-1003.',
         json.dumps({"cluster_id": "CLUSTER-2026-01", "reports_count": 3})),
        ('aud-002', 'usr-admin-01', 'Dr. Rajesh Kumar', 'ADMIN', 'ASSIGN_DEPARTMENT', 'REPORT', 'CS-2026-1004',
         three_hours_ago, 'Assigned overflowing garbage issue to Solid Waste Rapid Action Unit (Inspector Pooja Verma).',
         json.dumps({"team": "Solid Waste Rapid Action Unit"})),
        ('aud-003', 'usr-field-01', 'Pooja Verma', 'FIELD_TEAM', 'UPDATE_STATUS', 'REPORT', 'CS-2026-1005',
         one_hour_ago, 'Updated status to IN_PROGRESS. Deployed high-capacity diesel pump to Northern Railway Underpass.',
         json.dumps({"new_status": "IN_PROGRESS"})),
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO audit_logs (
            id, actor_id, actor_name, actor_role, action, affected_entity, entity_id, timestamp, details, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, audits)

    conn.commit()
