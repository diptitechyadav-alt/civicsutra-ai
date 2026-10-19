import {
  AuditLogEntry,
  DuplicateCandidate,
  IssueCluster,
  LocationData,
  NotificationItem,
  PriorityLevel,
  PriorityScoreBreakdown,
  Report,
} from '../types';

export function normalizePriorityScore(rawScore: any): PriorityScoreBreakdown {
  if (!rawScore) {
    return {
      totalScore: 50,
      level: 'MEDIUM',
      volumeFactor: 10,
      severityFactor: 15,
      vulnerabilityFactor: 10,
      stalenessFactor: 10,
      reasoning: 'Calibrated algorithmic priority rating.',
    };
  }
  const totalScore = rawScore.totalScore ?? rawScore.total_score ?? 50;
  const level: PriorityLevel =
    rawScore.level ||
    (totalScore >= 80 ? 'CRITICAL' : totalScore >= 65 ? 'HIGH' : totalScore >= 45 ? 'MEDIUM' : 'LOW');

  return {
    totalScore,
    level,
    volumeFactor: rawScore.volumeFactor ?? rawScore.volume_factor ?? 10,
    severityFactor: rawScore.severityFactor ?? rawScore.severity_factor ?? 15,
    vulnerabilityFactor: rawScore.vulnerabilityFactor ?? rawScore.vulnerability_factor ?? 10,
    stalenessFactor: rawScore.stalenessFactor ?? rawScore.staleness_factor ?? 10,
    reasoning: rawScore.reasoning || `Hazard priority level ${level} (${totalScore}/100 pts)`,
  };
}

export function normalizeReport(raw: any): Report {
  if (!raw) return {} as Report;
  const priorityScore = normalizePriorityScore(raw.priorityScore || raw.priority_score);

  const loc = raw.location || {};
  const normalizedLoc: LocationData = {
    latitude: loc.latitude ?? 28.6139,
    longitude: loc.longitude ?? 77.209,
    address: loc.address || loc.human_readable_location || 'Ward 14, New Delhi',
    landmark: loc.landmark,
    ward: loc.ward || 'Ward 14',
    city: loc.city || 'New Delhi',
    isGpsVerified: Boolean(loc.isGpsVerified ?? loc.is_gps_verified ?? false),
  };

  return {
    ...raw,
    id: raw.id || raw.public_reference_id || 'CS-2026-UNKNOWN',
    title: raw.title || 'Untitled Civic Grievance',
    description: raw.description || '',
    category: raw.category || 'other',
    aiSuggestedCategory: raw.aiSuggestedCategory || raw.ai_suggested_category,
    aiCategoryConfidence: raw.aiCategoryConfidence ?? raw.ai_category_confidence,
    location: normalizedLoc,
    photos: Array.isArray(raw.photos)
      ? raw.photos
      : raw.image_reference
      ? [raw.image_reference]
      : [],
    citizenId: raw.citizenId || raw.submitted_by || 'usr-citizen-01',
    citizenName: raw.citizenName || raw.citizen_name || 'Citizen',
    citizenPhone: raw.citizenPhone || raw.citizen_phone,
    createdAt: raw.createdAt || raw.created_at || raw.submission_timestamp || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
    status: raw.status || 'SUBMITTED',
    priorityScore,
    clusterId: raw.clusterId || raw.cluster_id,
    assignedTo: raw.assignedTo || (raw.assigned_team ? {
      teamId: raw.assigned_team,
      teamName: raw.assigned_team,
      assigneeName: 'Assigned Inspector',
      assignedAt: raw.updated_at || new Date().toISOString(),
    } : undefined),
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
  };
}

export function normalizeCluster(raw: any): IssueCluster {
  if (!raw) return {} as IssueCluster;
  const priorityScore = normalizePriorityScore(raw.priorityScore || raw.priority_score);
  const center = raw.centerLocation || raw.center_location || {};

  return {
    ...raw,
    id: raw.id || raw.cluster_id || 'CLUSTER-01',
    title: raw.title || 'Issue Cluster',
    primaryCategory: raw.primaryCategory || raw.category || 'infrastructure',
    reportCount: raw.reportCount ?? raw.report_count ?? (raw.reportIds || raw.report_ids || []).length ?? 1,
    reportIds: raw.reportIds || raw.report_ids || [],
    centerLocation: {
      latitude: center.latitude ?? 28.6139,
      longitude: center.longitude ?? 77.209,
      address: center.address || center.representative_location || 'Ward 14, New Delhi',
      landmark: center.landmark,
      ward: center.ward || 'Ward 14',
      city: center.city || 'New Delhi',
      isGpsVerified: true,
    },
    status: raw.status || raw.cluster_status || 'APPROVED',
    priorityScore,
    aiConfidence: raw.aiConfidence ?? raw.ai_confidence ?? 90,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
    assignedDepartment: raw.assignedDepartment || raw.assigned_department,
    reviewerNotes: raw.reviewerNotes || raw.reviewer_notes,
  };
}

export function getAuthHeaders(isJson = true): Record<string, string> {
  const token = localStorage.getItem('civicsutra_token');
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    if (
      err?.name === 'TypeError' &&
      (err.message?.includes('fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Failed') ||
        err.message?.includes('Load'))
    ) {
      throw new Error(
        'Cannot connect to CivicSutra API server. Please verify the backend is running on http://127.0.0.1:8000.'
      );
    }
    throw err;
  }
}

async function handleApiResponse<T = any>(res: Response, defaultErrorMsg: string): Promise<T> {
  let body: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    try {
      const text = await res.text();
      body = text ? { detail: text } : null;
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const errorDetail =
      (body && (body.detail || body.message || body.error)) ||
      `${defaultErrorMsg} (Server returned HTTP ${res.status})`;
    throw new Error(errorDetail);
  }

  return body as T;
}

export const api = {
  // Auth & Identity
  async register(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    ward?: string;
    preferred_language?: string;
  }): Promise<{ success: boolean; token: string; user: any; message?: string }> {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleApiResponse(res, 'Registration failed');
  },

  async login(payload: {
    email?: string;
    password?: string;
    role?: string;
  }): Promise<{ success: boolean; token: string; user: any; message?: string }> {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleApiResponse(res, 'Sign in failed');
  },

  async getMe(): Promise<any> {
    const res = await apiFetch('/api/auth/me', {
      headers: getAuthHeaders(true),
    });
    return handleApiResponse(res, 'Not authenticated');
  },

  async getUsers(): Promise<any[]> {
    const res = await apiFetch('/api/auth/users');
    const data = await handleApiResponse(res, 'Failed to fetch user directory');
    return Array.isArray(data) ? data : [];
  },

  // Image Upload
  async uploadImage(file: File): Promise<{ success: boolean; url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch('/api/reports/upload-image', {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: formData,
    });
    return handleApiResponse(res, 'Photo upload failed');
  },

  // Reports
  async getReports(params: {
    role?: string;
    userId?: string;
    category?: string;
    status?: string;
    search?: string;
    isPublic?: boolean;
  } = {}): Promise<Report[]> {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.userId) query.set('userId', params.userId);
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.isPublic) query.set('isPublic', 'true');

    const res = await apiFetch(`/api/reports?${query.toString()}`, {
      headers: getAuthHeaders(false),
    });
    const data = await handleApiResponse(res, 'Failed to fetch reports');
    return Array.isArray(data) ? data.map(normalizeReport) : [];
  },

  async getReportById(id: string, isPublic = false): Promise<Report> {
    const res = await apiFetch(`/api/reports/${id}${isPublic ? '?isPublic=true' : ''}`, {
      headers: getAuthHeaders(false),
    });
    const data = await handleApiResponse(res, 'Failed to fetch report');
    return normalizeReport(data);
  },

  async submitReport(payload: Partial<Report>): Promise<{ success: boolean; report: Report; referenceId: string }> {
    const res = await apiFetch('/api/reports', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    const data = await handleApiResponse(res, 'Failed to submit report');
    return {
      ...data,
      report: normalizeReport(data.report),
    };
  },

  async updateReportStatus(
    id: string,
    status: string,
    note?: string,
    actorName?: string,
    actorRole?: string
  ): Promise<{ success: boolean; report: Report }> {
    const res = await apiFetch(`/api/reports/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status, note, actorName, actorRole }),
    });
    const data = await handleApiResponse(res, 'Failed to update status');
    return {
      ...data,
      report: normalizeReport(data.report),
    };
  },

  async assignReport(
    id: string,
    assignment: { teamId: string; teamName: string; assigneeName?: string; actorName?: string }
  ): Promise<{ success: boolean; report: Report }> {
    const res = await apiFetch(`/api/reports/${id}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(assignment),
    });
    const data = await handleApiResponse(res, 'Failed to assign report');
    return {
      ...data,
      report: normalizeReport(data.report),
    };
  },

  // Duplicates
  async getDuplicates(): Promise<
    (DuplicateCandidate & { report1?: Report; report2?: Report })[]
  > {
    const res = await apiFetch('/api/duplicates', {
      headers: getAuthHeaders(false),
    });
    const data = await handleApiResponse(res, 'Failed to fetch duplicates');
    return Array.isArray(data)
      ? data.map((d: any) => ({
          ...d,
          report1: d.report1 ? normalizeReport(d.report1) : undefined,
          report2: d.report2 ? normalizeReport(d.report2) : undefined,
        }))
      : [];
  },

  async reviewDuplicate(payload: {
    reportId: string;
    matchingReportId: string;
    action: 'CONFIRM_SAME' | 'CONFIRM_DIFFERENT';
    reviewerNotes?: string;
    actorName?: string;
  }): Promise<{ success: boolean; status: string }> {
    const res = await apiFetch('/api/duplicates/review', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleApiResponse(res, 'Failed to review duplicate');
  },

  // Clusters
  async getClusters(): Promise<IssueCluster[]> {
    const res = await apiFetch('/api/clusters', {
      headers: getAuthHeaders(false),
    });
    const data = await handleApiResponse(res, 'Failed to fetch clusters');
    return Array.isArray(data) ? data.map(normalizeCluster) : [];
  },

  async getClusterById(id: string): Promise<{ cluster: IssueCluster; reports: Report[] }> {
    const res = await apiFetch(`/api/clusters/${id}`, {
      headers: getAuthHeaders(false),
    });
    const data = await handleApiResponse(res, 'Failed to fetch cluster');
    return {
      cluster: normalizeCluster(data.cluster),
      reports: Array.isArray(data.reports) ? data.reports.map(normalizeReport) : [],
    };
  },

  async createCluster(payload: {
    title?: string;
    reportIds: string[];
    primaryCategory?: string;
    reviewerNotes?: string;
  }): Promise<{ success: boolean; cluster: IssueCluster }> {
    const res = await apiFetch('/api/clusters', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
    const data = await handleApiResponse(res, 'Failed to create cluster');
    return {
      ...data,
      cluster: normalizeCluster(data.cluster),
    };
  },

  // Analytics
  async getAnalytics(): Promise<{
    kpis: {
      totalReports: number;
      unreviewed: number;
      inProgress: number;
      resolved: number;
      criticalCount: number;
      activeClusters: number;
      suspectedDuplicates: number;
    };
    categoryCounts: Record<string, number>;
    statusCounts: Record<string, number>;
    hotspots: Array<{
      id: string;
      title: string;
      latitude: number;
      longitude: number;
      category: string;
      priorityLevel: string;
      score: number;
      status: string;
      clusterId?: string;
    }>;
  }> {
    const res = await apiFetch('/api/analytics', {
      headers: getAuthHeaders(false),
    });
    return handleApiResponse(res, 'Failed to fetch analytics');
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await apiFetch('/api/audit', {
      headers: getAuthHeaders(true),
    });
    return handleApiResponse(res, 'Failed to fetch audit logs');
  },

  // Notifications
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const res = await apiFetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders(false),
    });
    const data = await handleApiResponse(res, 'Failed to fetch notifications');
    return Array.isArray(data) ? data : [];
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
    });
    return handleApiResponse(res, 'Failed to mark read');
  },

  // Reset Demo
  async resetDemo(): Promise<void> {
    const res = await apiFetch('/api/system/reset-demo', { method: 'POST' });
    return handleApiResponse(res, 'Failed to reset demo');
  },
};
