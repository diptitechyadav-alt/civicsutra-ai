-- ==============================================================================
-- CivicSutra AI — Master Relational Database Schema
-- Compatible with PostgreSQL, Supabase, and SQLite
-- ==============================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('CITIZEN', 'ADMIN', 'FIELD_TEAM')),
    password_hash TEXT,
    phone TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK(preferred_language IN ('en', 'hi')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_status TEXT DEFAULT 'ACTIVE' CHECK(account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING'))
);

-- 2. REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    public_reference_id TEXT UNIQUE NOT NULL,
    submitted_by TEXT NOT NULL REFERENCES users(id),
    citizen_name TEXT NOT NULL,
    citizen_phone TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN (
        'pothole', 'garbage', 'waterlogging', 'drainage',
        'streetlight', 'water_supply', 'traffic', 'infrastructure', 'other'
    )),
    latitude REAL,
    longitude REAL,
    human_readable_location TEXT NOT NULL,
    landmark TEXT,
    ward TEXT DEFAULT 'Ward 14',
    city TEXT DEFAULT 'New Delhi',
    is_gps_verified BOOLEAN DEFAULT 0,
    image_reference TEXT,
    submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN (
        'SUBMITTED', 'UNDER_REVIEW', 'DUPLICATE_FLAGGED', 'CLUSTERED',
        'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
    )),
    assigned_team TEXT,
    privacy_settings TEXT DEFAULT 'STANDARD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_submitted_by ON reports(submitted_by);

-- 3. AI ANALYSIS
CREATE TABLE IF NOT EXISTS ai_analysis (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    predicted_category TEXT NOT NULL,
    extracted_structured_details TEXT, -- JSON blob with summary, severity, traffic impact
    model_provider TEXT NOT NULL DEFAULT 'demo',
    confidence_score REAL DEFAULT 0.0,
    analysis_status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(analysis_status IN ('PENDING', 'COMPLETED', 'FAILED')),
    error_details TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_report ON ai_analysis(report_id);

-- 4. DUPLICATE SUGGESTIONS
CREATE TABLE IF NOT EXISTS duplicate_suggestions (
    id TEXT PRIMARY KEY,
    source_report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    candidate_report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    location_similarity REAL NOT NULL, -- Distance in meters
    text_similarity REAL NOT NULL,     -- Percentage (0 to 100)
    image_similarity REAL DEFAULT 0.0, -- Percentage (0 to 100)
    category_agreement BOOLEAN NOT NULL DEFAULT 1,
    combined_score REAL NOT NULL,      -- Overall confidence (0 to 100)
    review_status TEXT DEFAULT 'PENDING_REVIEW' CHECK(review_status IN (
        'PENDING_REVIEW', 'CONFIRMED_SAME_ISSUE', 'CONFIRMED_DIFFERENT_ISSUE'
    )),
    reviewer_id TEXT REFERENCES users(id),
    review_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_dup_pair UNIQUE (source_report_id, candidate_report_id)
);

CREATE INDEX IF NOT EXISTS idx_dup_source ON duplicate_suggestions(source_report_id);
CREATE INDEX IF NOT EXISTS idx_dup_candidate ON duplicate_suggestions(candidate_report_id);

-- 5. ISSUE CLUSTERS
CREATE TABLE IF NOT EXISTS issue_clusters (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    representative_latitude REAL NOT NULL,
    representative_longitude REAL NOT NULL,
    representative_location TEXT NOT NULL,
    landmark TEXT,
    cluster_status TEXT DEFAULT 'APPROVED' CHECK(cluster_status IN ('PROPOSED', 'APPROVED', 'IN_PROGRESS', 'RESOLVED')),
    priority_score INTEGER DEFAULT 50,
    priority_factors TEXT, -- JSON breakdown: volume, severity, vulnerability, staleness
    assigned_department TEXT,
    reviewer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CLUSTER REPORTS (Many-to-Many report to cluster membership)
CREATE TABLE IF NOT EXISTS cluster_reports (
    cluster_id TEXT NOT NULL REFERENCES issue_clusters(id) ON DELETE CASCADE,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    association_status TEXT DEFAULT 'CONFIRMED' CHECK(association_status IN ('SUGGESTED', 'CONFIRMED', 'REMOVED')),
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cluster_id, report_id)
);

-- 7. STATUS HISTORY
CREATE TABLE IF NOT EXISTS status_history (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    cluster_id TEXT REFERENCES issue_clusters(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    actor_role TEXT NOT NULL DEFAULT 'ADMIN',
    note TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_report ON status_history(report_id);

-- 8. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    issue_reference TEXT NOT NULL, -- report_id or cluster_id
    assigned_team TEXT NOT NULL,
    assignee_name TEXT,
    assignment_status TEXT DEFAULT 'ACTIVE' CHECK(assignment_status IN ('ACTIVE', 'COMPLETED', 'REASSIGNED')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL DEFAULT 'STATUS_UPDATE',
    report_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_id);

-- 10. FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    report_reference TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    submitted_by TEXT NOT NULL REFERENCES users(id),
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    affected_entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    metadata TEXT -- JSON formatted safe metadata
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
