from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

UserRole = Literal["CITIZEN", "ADMIN", "FIELD_TEAM"]
IssueCategory = Literal[
    "pothole", "garbage", "waterlogging", "drainage",
    "streetlight", "water_supply", "traffic", "infrastructure", "other"
]
IssueStatus = Literal[
    "SUBMITTED", "UNDER_REVIEW", "DUPLICATE_FLAGGED", "CLUSTERED",
    "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"
]

class UserSchema(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    preferred_language: str = "en"
    account_status: str = "ACTIVE"
    ward: Optional[str] = "Ward 14"
    phone: Optional[str] = None

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    ward: Optional[str] = "Ward 14"
    preferred_language: Optional[str] = "en"

class LoginRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None

class AuthResponse(BaseModel):
    success: bool
    token: str
    user: UserSchema
    message: Optional[str] = None

class LocationData(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = "Ward 14 Civic Zone"
    landmark: Optional[str] = None
    ward: Optional[str] = "Ward 14"
    city: Optional[str] = "New Delhi"
    is_gps_verified: bool = False

class PriorityScoreBreakdown(BaseModel):
    total_score: int
    level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    volume_factor: int
    severity_factor: int
    vulnerability_factor: int
    staleness_factor: int
    recurrence_factor: int = 0
    evidence_factor: int = 5
    calculated_at: str
    reasoning: str

class ReportCreate(BaseModel):
    title: str
    description: str
    category: Optional[IssueCategory] = None
    location: LocationData
    photos: Optional[List[str]] = []
    citizen_id: Optional[str] = Field(None, alias="citizenId")
    citizen_name: Optional[str] = Field(None, alias="citizenName")
    citizen_phone: Optional[str] = Field(None, alias="citizenPhone")

    model_config = {"populate_by_name": True}

class ReportResponse(BaseModel):
    id: str
    public_reference_id: str
    submitted_by: str
    citizen_name: str
    citizen_phone: Optional[str] = None
    title: str
    description: str
    category: IssueCategory
    ai_suggested_category: Optional[str] = None
    ai_category_confidence: Optional[float] = None
    location: LocationData
    photos: List[str] = []
    submission_timestamp: str
    status: IssueStatus
    assigned_team: Optional[str] = None
    cluster_id: Optional[str] = None
    priority_score: PriorityScoreBreakdown
    created_at: str
    updated_at: str

class ReportUpdateStatus(BaseModel):
    status: IssueStatus
    note: Optional[str] = None
    actor_name: Optional[str] = "Dr. Rajesh Kumar"
    actor_role: Optional[UserRole] = "ADMIN"

class ReportAssign(BaseModel):
    team_id: str
    team_name: str
    assignee_name: Optional[str] = None
    actor_name: Optional[str] = "Dr. Rajesh Kumar"

class DuplicateSuggestionResponse(BaseModel):
    id: str
    source_report_id: str
    candidate_report_id: str
    location_similarity: float # meters
    text_similarity: float     # %
    image_similarity: float    # %
    category_agreement: bool
    combined_score: float      # %
    review_status: str
    reviewer_id: Optional[str] = None
    review_note: Optional[str] = None
    created_at: str
    report1: Optional[Dict[str, Any]] = None
    report2: Optional[Dict[str, Any]] = None

class DuplicateReviewRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    report_id: str = Field(..., alias="reportId")
    matching_report_id: str = Field(..., alias="matchingReportId")
    action: Literal["CONFIRM_SAME", "CONFIRM_DIFFERENT"]
    reviewer_notes: Optional[str] = Field(None, alias="reviewerNotes")
    actor_name: Optional[str] = Field("Dr. Rajesh Kumar", alias="actorName")

class IssueClusterResponse(BaseModel):
    id: str
    title: str
    category: str
    report_count: int
    report_ids: List[str]
    center_location: LocationData
    cluster_status: str
    priority_score: PriorityScoreBreakdown
    ai_confidence: int
    assigned_department: Optional[str] = None
    reviewer_notes: Optional[str] = None
    created_at: str
    updated_at: str

class ClusterCreateRequest(BaseModel):
    title: Optional[str] = None
    report_ids: List[str]
    primary_category: Optional[str] = None
    reviewer_notes: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: str
    actor_id: str
    actor_name: str
    actor_role: str
    action: str
    affected_entity: str
    entity_id: str
    timestamp: str
    details: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    recipient_id: str
    notification_type: str
    report_id: Optional[str] = None
    title: str
    message: str
    read_status: bool
    created_at: str

class FeedbackCreate(BaseModel):
    report_reference: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class AnalyticsResponse(BaseModel):
    kpis: Dict[str, int]
    category_counts: Dict[str, int]
    status_counts: Dict[str, int]
    hotspots: List[Dict[str, Any]]
