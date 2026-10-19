export type UserRole = 'CITIZEN' | 'ADMIN' | 'FIELD_TEAM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward?: string;
  department?: string;
  phone?: string;
}

export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'waterlogging'
  | 'drainage'
  | 'streetlight'
  | 'water_supply'
  | 'traffic'
  | 'infrastructure'
  | 'other';

export type IssueStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DUPLICATE_FLAGGED'
  | 'CLUSTERED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriorityScoreBreakdown {
  totalScore: number; // 0 - 100
  level: PriorityLevel;
  volumeFactor: number; // 0 - 30 (duplicate / report density)
  severityFactor: number; // 0 - 30 (hazard level)
  vulnerabilityFactor: number; // 0 - 25 (proximity to school, hospital, public transit)
  stalenessFactor: number; // 0 - 15 (time pending without resolution)
  reasoning: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  ward?: string;
  city?: string;
  isGpsVerified: boolean;
}

export interface StatusTimelineEntry {
  id: string;
  status: IssueStatus;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  note?: string;
  isPublic: boolean;
}

export interface Report {
  id: string; // e.g. "CS-2026-1042"
  title: string;
  description: string;
  category: IssueCategory;
  aiSuggestedCategory?: IssueCategory;
  aiCategoryConfidence?: number; // 0 - 100
  location: LocationData;
  photos: string[]; // Base64 or URL
  citizenId: string;
  citizenName: string; // Kept private on public views
  citizenPhone?: string; // Private
  createdAt: string;
  updatedAt: string;
  status: IssueStatus;
  priorityScore: PriorityScoreBreakdown;
  clusterId?: string; // If grouped into an issue cluster
  assignedTo?: {
    teamId: string;
    teamName: string;
    assigneeName?: string;
    assignedAt: string;
  };
  fieldNotes?: string[];
  resolutionEvidence?: {
    photoUrl?: string;
    resolvedAt?: string;
    notes?: string;
  };
  timeline: StatusTimelineEntry[];
}

export interface DuplicateCandidate {
  reportId: string;
  matchingReportId: string;
  overallConfidence: number; // 0 - 100
  distanceMeters: number;
  semanticSimilarity: number; // 0 - 100
  categoryMatch: boolean;
  imageSimilarity: number; // 0 - 100
  explanation: string;
  status: 'PENDING_REVIEW' | 'CONFIRMED_SAME_ISSUE' | 'CONFIRMED_DIFFERENT_ISSUE';
}

export interface IssueCluster {
  id: string; // e.g. "CLUSTER-2026-08"
  title: string;
  primaryCategory: IssueCategory;
  reportCount: number;
  reportIds: string[];
  centerLocation: LocationData;
  status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'RESOLVED';
  priorityScore: PriorityScoreBreakdown;
  aiConfidence: number; // 0 - 100
  createdAt: string;
  updatedAt: string;
  assignedDepartment?: string;
  reviewerNotes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'REPORT' | 'CLUSTER' | 'DUPLICATE' | 'SYSTEM';
  targetId: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  reportId?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'STATUS_UPDATE' | 'CLUSTER_ASSOCIATION' | 'SYSTEM';
}
