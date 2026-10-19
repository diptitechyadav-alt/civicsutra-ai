import express, { Request, Response } from 'express';
import cors from 'cors';
import { db, DEMO_USERS } from './db.js';
import {
  calculatePriorityScore,
  evaluateDuplicateCandidate,
  predictCategoryFromText,
} from './aiEngine.js';
import {
  IssueCategory,
  IssueStatus,
  LocationData,
  Report,
  UserRole,
} from './types.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'CivicSutra AI',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
  });
});

// ==========================================
// AUTH & USERS
// ==========================================
app.get('/api/auth/users', (req: Request, res: Response) => {
  res.json(db.getUsers());
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  let user = db.getUsers().find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user && role) {
    user = db.getUsers().find((u) => u.role === role);
  }

  if (!user) {
    // Default to citizen
    user = DEMO_USERS[0];
  }

  res.json({ success: true, user });
});

// ==========================================
// REPORTS
// ==========================================
app.get('/api/reports', (req: Request, res: Response) => {
  const { role, userId, category, status, search, isPublic } = req.query;
  let reports = db.getReports();

  // Role filtering: Citizen only sees their own reports on their dashboard view
  if (role === 'CITIZEN' && userId) {
    reports = reports.filter((r) => r.citizenId === userId);
  }

  if (category) {
    reports = reports.filter((r) => r.category === category);
  }

  if (status) {
    reports = reports.filter((r) => r.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    reports = reports.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.address.toLowerCase().includes(q)
    );
  }

  // Public Privacy Filtering: Mask personal citizen identity on public views
  if (isPublic === 'true') {
    const safeReports = reports.map((r) => ({
      ...r,
      citizenName: 'Verified Citizen (Identity Protected)',
      citizenPhone: undefined,
      citizenId: 'anonymized',
    }));
    return res.json(safeReports);
  }

  res.json(reports);
});

app.get('/api/reports/:id', (req: Request, res: Response) => {
  const report = db.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (req.query.isPublic === 'true') {
    return res.json({
      ...report,
      citizenName: 'Verified Citizen (Identity Protected)',
      citizenPhone: undefined,
      citizenId: 'anonymized',
    });
  }

  res.json(report);
});

// Submit a new problem
app.post('/api/reports', (req: Request, res: Response) => {
  const {
    title,
    description,
    category,
    location,
    photos = [],
    citizenId = 'usr-citizen-01',
    citizenName = 'Aarav Sharma',
    citizenPhone,
  } = req.body;

  if (!title || !description || !location) {
    return res.status(400).json({ error: 'Missing required report fields' });
  }

  // 1. AI Auto-categorization validation
  const aiCat = predictCategoryFromText(`${title} ${description}`);
  const finalCategory: IssueCategory = category || aiCat.category;

  // 2. Generate Reference ID (e.g., CS-2026-1048)
  const count = db.getReports().length + 1;
  const id = `CS-2026-${1000 + count}`;
  const now = new Date().toISOString();

  // 3. Multi-Factor Priority Score calculation
  const priorityScore = calculatePriorityScore(
    finalCategory,
    1,
    now,
    location.landmark
  );

  const newReport: Report = {
    id,
    title,
    description,
    category: finalCategory,
    aiSuggestedCategory: aiCat.category,
    aiCategoryConfidence: aiCat.confidence,
    location: {
      latitude: Number(location.latitude) || 28.6139,
      longitude: Number(location.longitude) || 77.2090,
      address: location.address || 'Reported Location, Ward 14',
      landmark: location.landmark,
      ward: location.ward || 'Ward 14',
      city: location.city || 'New Delhi',
      isGpsVerified: Boolean(location.isGpsVerified),
    },
    photos,
    citizenId,
    citizenName,
    citizenPhone,
    createdAt: now,
    updatedAt: now,
    status: 'SUBMITTED',
    priorityScore,
    timeline: [
      {
        id: `tl-${id}-1`,
        status: 'SUBMITTED',
        timestamp: now,
        actorName: citizenName,
        actorRole: 'CITIZEN',
        note: 'Report submitted via CivicSutra AI portal.',
        isPublic: true,
      },
    ],
  };

  db.addReport(newReport);

  // 4. Run AI Duplicate Candidate Detection against existing reports
  const otherReports = db.getReports().filter((r) => r.id !== id);
  for (const other of otherReports) {
    const candidate = evaluateDuplicateCandidate(newReport, other);
    if (candidate) {
      db.addDuplicate(candidate);
    }
  }

  // 5. Add Audit Log
  db.addAuditLog({
    actorId: citizenId,
    actorName: citizenName,
    actorRole: 'CITIZEN',
    action: 'CREATE_REPORT',
    targetType: 'REPORT',
    targetId: id,
    details: `Citizen submitted report ${id} for category ${finalCategory} in Ward 14.`,
  });

  // 6. In-App Notification for Citizen
  db.addNotification({
    userId: citizenId,
    reportId: id,
    title: 'Report Received Successfully',
    message: `Your report ${id} has been logged and queued for administrative review.`,
    type: 'STATUS_UPDATE',
  });

  res.status(201).json({
    success: true,
    report: newReport,
    referenceId: id,
  });
});

// Update Report Status
app.patch('/api/reports/:id/status', (req: Request, res: Response) => {
  const { status, note, actorName = 'Dr. Rajesh Kumar', actorRole = 'ADMIN' } = req.body;
  const report = db.getReportById(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const now = new Date().toISOString();
  const timelineEntry = {
    id: `tl-${report.id}-${report.timeline.length + 1}`,
    status: status as IssueStatus,
    timestamp: now,
    actorName,
    actorRole: actorRole as UserRole,
    note: note || `Status transitioned to ${status}`,
    isPublic: true,
  };

  const updated = db.updateReport(report.id, {
    status: status as IssueStatus,
    timeline: [...report.timeline, timelineEntry],
  });

  db.addAuditLog({
    actorId: 'usr-actor',
    actorName,
    actorRole: actorRole as UserRole,
    action: 'UPDATE_STATUS',
    targetType: 'REPORT',
    targetId: report.id,
    details: `Status updated to ${status}. Note: ${note || 'None'}`,
  });

  // Notify citizen
  db.addNotification({
    userId: report.citizenId,
    reportId: report.id,
    title: `Status Update: ${status}`,
    message: `Your report ${report.id} is now ${status}. ${note || ''}`,
    type: 'STATUS_UPDATE',
  });

  res.json({ success: true, report: updated });
});

// Assign Report to Team
app.post('/api/reports/:id/assign', (req: Request, res: Response) => {
  const { teamId, teamName, assigneeName, actorName = 'Dr. Rajesh Kumar' } = req.body;
  const report = db.getReportById(req.params.id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const now = new Date().toISOString();
  const updated = db.updateReport(report.id, {
    status: 'ASSIGNED',
    assignedTo: {
      teamId,
      teamName,
      assigneeName,
      assignedAt: now,
    },
    timeline: [
      ...report.timeline,
      {
        id: `tl-${report.id}-${report.timeline.length + 1}`,
        status: 'ASSIGNED',
        timestamp: now,
        actorName,
        actorRole: 'ADMIN',
        note: `Assigned to ${teamName} (${assigneeName || 'Duty Officer'}).`,
        isPublic: true,
      },
    ],
  });

  db.addAuditLog({
    actorId: 'usr-admin-01',
    actorName,
    actorRole: 'ADMIN',
    action: 'ASSIGN_TEAM',
    targetType: 'REPORT',
    targetId: report.id,
    details: `Assigned report ${report.id} to ${teamName} (${assigneeName}).`,
  });

  res.json({ success: true, report: updated });
});

// ==========================================
// DUPLICATE INTELLIGENCE
// ==========================================
app.get('/api/duplicates', (req: Request, res: Response) => {
  const duplicates = db.getDuplicates();
  // Attach current report titles for convenience
  const enriched = duplicates.map((d) => {
    const r1 = db.getReportById(d.reportId);
    const r2 = db.getReportById(d.matchingReportId);
    return {
      ...d,
      report1: r1,
      report2: r2,
    };
  });
  res.json(enriched);
});

app.post('/api/duplicates/review', (req: Request, res: Response) => {
  const { reportId, matchingReportId, action, reviewerNotes, actorName = 'Dr. Rajesh Kumar' } = req.body;

  const newStatus =
    action === 'CONFIRM_SAME' ? 'CONFIRMED_SAME_ISSUE' : 'CONFIRMED_DIFFERENT_ISSUE';

  const updated = db.updateDuplicateStatus(reportId, matchingReportId, newStatus);

  if (updated && action === 'CONFIRM_SAME') {
    // If confirmed same, update second report's status to DUPLICATE_FLAGGED
    const r2 = db.getReportById(matchingReportId);
    if (r2) {
      db.updateReport(r2.id, {
        status: 'DUPLICATE_FLAGGED',
      });
    }
  }

  db.addAuditLog({
    actorId: 'usr-admin-01',
    actorName,
    actorRole: 'ADMIN',
    action: 'REVIEW_DUPLICATE',
    targetType: 'DUPLICATE',
    targetId: `${reportId}-${matchingReportId}`,
    details: `Reviewer set duplicate status to ${newStatus}. Notes: ${reviewerNotes || 'None'}`,
  });

  res.json({ success: true, status: newStatus });
});

// ==========================================
// CLUSTERS INTELLIGENCE
// ==========================================
app.get('/api/clusters', (req: Request, res: Response) => {
  res.json(db.getClusters());
});

app.get('/api/clusters/:id', (req: Request, res: Response) => {
  const cluster = db.getClusterById(req.params.id);
  if (!cluster) {
    return res.status(404).json({ error: 'Cluster not found' });
  }

  const reports = cluster.reportIds
    .map((id) => db.getReportById(id))
    .filter(Boolean) as Report[];

  res.json({ cluster, reports });
});

// Create new cluster manually or from selection
app.post('/api/clusters', (req: Request, res: Response) => {
  const { title, reportIds, primaryCategory, reviewerNotes } = req.body;
  if (!reportIds || reportIds.length === 0) {
    return res.status(400).json({ error: 'reportIds array is required' });
  }

  const reports = reportIds.map((id: string) => db.getReportById(id)).filter(Boolean) as Report[];
  if (reports.length === 0) {
    return res.status(400).json({ error: 'No valid reports found' });
  }

  const clusterId = `CLUSTER-2026-0${db.getClusters().length + 1}`;
  const now = new Date().toISOString();

  // Average coordinates
  const lat = reports.reduce((acc, r) => acc + r.location.latitude, 0) / reports.length;
  const lon = reports.reduce((acc, r) => acc + r.location.longitude, 0) / reports.length;

  const priorityScore = calculatePriorityScore(
    primaryCategory || reports[0].category,
    reports.length,
    now,
    reports[0].location.landmark
  );

  const cluster = {
    id: clusterId,
    title: title || `${reports[0].category.toUpperCase()} Cluster near ${reports[0].location.address}`,
    primaryCategory: primaryCategory || reports[0].category,
    reportCount: reports.length,
    reportIds,
    centerLocation: {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      address: reports[0].location.address,
      landmark: reports[0].location.landmark,
      ward: 'Ward 14',
      city: 'New Delhi',
      isGpsVerified: true,
    },
    status: 'APPROVED' as const,
    priorityScore,
    aiConfidence: 88,
    createdAt: now,
    updatedAt: now,
    reviewerNotes: reviewerNotes || 'Cluster approved by reviewer.',
  };

  db.addCluster(cluster);

  // Link reports
  for (const r of reports) {
    db.updateReport(r.id, {
      clusterId,
      status: 'CLUSTERED',
    });
  }

  db.addAuditLog({
    actorId: 'usr-admin-01',
    actorName: 'Dr. Rajesh Kumar',
    actorRole: 'ADMIN',
    action: 'CREATE_CLUSTER',
    targetType: 'CLUSTER',
    targetId: clusterId,
    details: `Created cluster ${clusterId} containing ${reports.length} reports.`,
  });

  res.status(201).json({ success: true, cluster });
});

// ==========================================
// ANALYTICS & DASHBOARD METRICS
// ==========================================
app.get('/api/analytics', (req: Request, res: Response) => {
  const reports = db.getReports();
  const clusters = db.getClusters();
  const duplicates = db.getDuplicates();

  const totalReports = reports.length;
  const unreviewed = reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
  const inProgress = reports.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length;
  const criticalCount = reports.filter((r) => r.priorityScore.level === 'CRITICAL' || r.priorityScore.level === 'HIGH').length;

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  for (const r of reports) {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  }

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const r of reports) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  // Hotspots for map
  const hotspots = reports.map((r) => ({
    id: r.id,
    title: r.title,
    latitude: r.location.latitude,
    longitude: r.location.longitude,
    category: r.category,
    priorityLevel: r.priorityScore.level,
    score: r.priorityScore.totalScore,
    status: r.status,
    clusterId: r.clusterId,
  }));

  res.json({
    kpis: {
      totalReports,
      unreviewed,
      inProgress,
      resolved,
      criticalCount,
      activeClusters: clusters.length,
      suspectedDuplicates: duplicates.filter((d) => d.status === 'PENDING_REVIEW').length,
    },
    categoryCounts,
    statusCounts,
    hotspots,
  });
});

// ==========================================
// AUDIT LOG
// ==========================================
app.get('/api/audit', (req: Request, res: Response) => {
  res.json(db.getAuditLogs());
});

// ==========================================
// NOTIFICATIONS
// ==========================================
app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr-citizen-01';
  res.json(db.getNotifications(userId));
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const ok = db.markNotificationRead(req.params.id);
  res.json({ success: ok });
});

// ==========================================
// RESET DEMO
// ==========================================
app.post('/api/system/reset-demo', (req: Request, res: Response) => {
  db.resetToDemo();
  res.json({ success: true, message: 'Database reset to demo state.' });
});

app.listen(PORT, () => {
  console.log(`CivicSutra AI Backend Server running on http://localhost:${PORT}`);
});
