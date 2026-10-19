import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AuditLogEntry,
  DuplicateCandidate,
  IssueCluster,
  NotificationItem,
  Report,
  User,
} from './types.js';
import { calculatePriorityScore } from './aiEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'civicsutra_db.json');

export interface DatabaseSchema {
  users: User[];
  reports: Report[];
  clusters: IssueCluster[];
  duplicates: DuplicateCandidate[];
  auditLogs: AuditLogEntry[];
  notifications: NotificationItem[];
}

// Seed Demo Accounts
export const DEMO_USERS: User[] = [
  {
    id: 'usr-citizen-01',
    name: 'Aarav Sharma',
    email: 'citizen@civicsutra.org',
    role: 'CITIZEN',
    ward: 'Ward 14 (South Zone)',
    phone: '+91 98765 43210',
  },
  {
    id: 'usr-admin-01',
    name: 'Dr. Rajesh Kumar',
    email: 'admin@civicsutra.org',
    role: 'ADMIN',
    department: 'Municipal Operations & Grievance Cell',
    phone: '+91 98111 22334',
  },
  {
    id: 'usr-field-01',
    name: 'Pooja Verma',
    email: 'field@civicsutra.org',
    role: 'FIELD_TEAM',
    ward: 'Ward 14',
    department: 'Roads & Infrastructure Maintenance Division',
    phone: '+91 98222 33445',
  },
];

// Seed Initial Realistic Reports
function getInitialReports(): Report[] {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();

  // Demonstration Coordinates (Centered around Ward 14 Delhi / Connaught / South Ring Road)
  // Lat: 28.6139, Lon: 77.2090
  return [
    {
      id: 'CS-2026-1001',
      title: 'Dangerous deep pothole near MG Road Bus Depot',
      description: 'Extremely deep pothole spanning 1.5 meters on the right lane near MG Road Bus Depot. Multiple two-wheelers have skidded here during evening hours.',
      category: 'pothole',
      aiSuggestedCategory: 'pothole',
      aiCategoryConfidence: 94,
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'MG Road, near Central Bus Depot Exit Gate',
        landmark: 'Central Bus Depot Gate 2',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      photos: [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      ],
      citizenId: 'usr-citizen-01',
      citizenName: 'Aarav Sharma',
      citizenPhone: '+91 98765 43210',
      createdAt: twoDaysAgo,
      updatedAt: oneDayAgo,
      status: 'CLUSTERED',
      priorityScore: calculatePriorityScore('pothole', 3, twoDaysAgo, 'Bus Depot Gate 2'),
      clusterId: 'CLUSTER-2026-01',
      timeline: [
        {
          id: 'tl-1001-1',
          status: 'SUBMITTED',
          timestamp: twoDaysAgo,
          actorName: 'Aarav Sharma',
          actorRole: 'CITIZEN',
          note: 'Report submitted via mobile portal with verified GPS location.',
          isPublic: true,
        },
        {
          id: 'tl-1001-2',
          status: 'UNDER_REVIEW',
          timestamp: oneDayAgo,
          actorName: 'Dr. Rajesh Kumar',
          actorRole: 'ADMIN',
          note: 'Report acknowledged by Grievance Control Room. AI identified 2 nearby corroborating reports.',
          isPublic: true,
        },
        {
          id: 'tl-1001-3',
          status: 'CLUSTERED',
          timestamp: oneDayAgo,
          actorName: 'Dr. Rajesh Kumar',
          actorRole: 'ADMIN',
          note: 'Associated into Cluster CLUSTER-2026-01 (MG Road Bus Depot Pothole Group).',
          isPublic: true,
        },
      ],
    },
    {
      id: 'CS-2026-1002',
      title: 'Large asphalt crater causing vehicle skids on MG Road',
      description: 'Large broken road cavity about 45 meters from bus stand exit. Tar is completely washed out, exposing jagged stone aggregate.',
      category: 'pothole',
      aiSuggestedCategory: 'pothole',
      aiCategoryConfidence: 92,
      location: {
        latitude: 28.6142,
        longitude: 77.2093,
        address: 'MG Road Northbound, 50m before Depot Gate',
        landmark: 'Bus Depot Metro Pillar 42',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      photos: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18086f7?w=600&auto=format&fit=crop&q=80',
      ],
      citizenId: 'usr-citizen-02',
      citizenName: 'Sunita Mehra',
      citizenPhone: '+91 98333 44556',
      createdAt: oneDayAgo,
      updatedAt: oneDayAgo,
      status: 'CLUSTERED',
      priorityScore: calculatePriorityScore('pothole', 3, oneDayAgo, 'Bus Depot Metro Pillar'),
      clusterId: 'CLUSTER-2026-01',
      timeline: [
        {
          id: 'tl-1002-1',
          status: 'SUBMITTED',
          timestamp: oneDayAgo,
          actorName: 'Sunita Mehra',
          actorRole: 'CITIZEN',
          note: 'Report submitted with photo evidence.',
          isPublic: true,
        },
        {
          id: 'tl-1002-2',
          status: 'CLUSTERED',
          timestamp: oneDayAgo,
          actorName: 'Dr. Rajesh Kumar',
          actorRole: 'ADMIN',
          note: 'Corroborating evidence linked to Cluster CLUSTER-2026-01.',
          isPublic: true,
        },
      ],
    },
    {
      id: 'CS-2026-1003',
      title: 'Deep road depression breaking car suspensions near depot',
      description: 'Severe road depression on MG road opposite traffic light. Bumper damage reported by multiple autos and private cars today.',
      category: 'pothole',
      aiSuggestedCategory: 'pothole',
      aiCategoryConfidence: 89,
      location: {
        latitude: 28.6140,
        longitude: 77.2091,
        address: 'MG Road, Adjacent to Depot Traffic Signal',
        landmark: 'Depot Traffic Signal',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      photos: [
        'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
      ],
      citizenId: 'usr-citizen-03',
      citizenName: 'Vikram Joshi',
      citizenPhone: '+91 98444 55667',
      createdAt: fiveHoursAgo,
      updatedAt: fiveHoursAgo,
      status: 'CLUSTERED',
      priorityScore: calculatePriorityScore('pothole', 3, fiveHoursAgo, 'Depot Traffic Signal'),
      clusterId: 'CLUSTER-2026-01',
      timeline: [
        {
          id: 'tl-1003-1',
          status: 'SUBMITTED',
          timestamp: fiveHoursAgo,
          actorName: 'Vikram Joshi',
          actorRole: 'CITIZEN',
          note: 'Report submitted.',
          isPublic: true,
        },
        {
          id: 'tl-1003-2',
          status: 'CLUSTERED',
          timestamp: fiveHoursAgo,
          actorName: 'Dr. Rajesh Kumar',
          actorRole: 'ADMIN',
          note: 'Auto-clustered into CLUSTER-2026-01 pending work order completion.',
          isPublic: true,
        },
      ],
    },
    {
      id: 'CS-2026-1004',
      title: 'Overflowing community garbage container near Mandi Gate',
      description: 'Sanitation bin overflowing onto main pedestrian footpath for over 48 hours. Stray cattle and severe foul smell affecting market shoppers.',
      category: 'garbage',
      aiSuggestedCategory: 'garbage',
      aiCategoryConfidence: 96,
      location: {
        latitude: 28.6180,
        longitude: 77.2150,
        address: 'Ward 14 Vegetable Mandi Road, Lane 3',
        landmark: 'Vegetable Mandi Main Gate',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      photos: [
        'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80',
      ],
      citizenId: 'usr-citizen-01',
      citizenName: 'Aarav Sharma',
      citizenPhone: '+91 98765 43210',
      createdAt: oneDayAgo,
      updatedAt: threeHoursAgo,
      status: 'ASSIGNED',
      priorityScore: calculatePriorityScore('garbage', 2, oneDayAgo, 'Vegetable Mandi Main Gate'),
      assignedTo: {
        teamId: 'team-sanitation-01',
        teamName: 'Solid Waste Rapid Action Unit',
        assigneeName: 'Pooja Verma',
        assignedAt: threeHoursAgo,
      },
      timeline: [
        {
          id: 'tl-1004-1',
          status: 'SUBMITTED',
          timestamp: oneDayAgo,
          actorName: 'Aarav Sharma',
          actorRole: 'CITIZEN',
          note: 'Report submitted by resident.',
          isPublic: true,
        },
        {
          id: 'tl-1004-2',
          status: 'ASSIGNED',
          timestamp: threeHoursAgo,
          actorName: 'Dr. Rajesh Kumar',
          actorRole: 'ADMIN',
          note: 'Dispatched to Solid Waste Rapid Action Unit. Clearance vehicle route scheduled.',
          isPublic: true,
        },
      ],
    },
    {
      id: 'CS-2026-1005',
      title: 'Severe waterlogging under Northern Railway Underpass',
      description: 'Rainwater accumulation over 2.5 feet under railway underpass. Small passenger vehicles cannot pass, causing heavy traffic backup.',
      category: 'waterlogging',
      aiSuggestedCategory: 'waterlogging',
      aiCategoryConfidence: 95,
      location: {
        latitude: 28.6210,
        longitude: 77.2115,
        address: 'Underpass Road connecting Ward 14 to Sector 8',
        landmark: 'Northern Railway Bridge #14',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      photos: [
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
      ],
      citizenId: 'usr-citizen-04',
      citizenName: 'Deepak Rao',
      citizenPhone: '+91 98666 77889',
      createdAt: threeHoursAgo,
      updatedAt: oneHourAgo,
      status: 'IN_PROGRESS',
      priorityScore: calculatePriorityScore('waterlogging', 2, threeHoursAgo, 'Railway Bridge Underpass'),
      assignedTo: {
        teamId: 'team-drainage-01',
        teamName: 'Stormwater & Drainage Division',
        assigneeName: 'Pooja Verma',
        assignedAt: oneHourAgo,
      },
      timeline: [
        {
          id: 'tl-1005-1',
          status: 'SUBMITTED',
          timestamp: threeHoursAgo,
          actorName: 'Deepak Rao',
          actorRole: 'CITIZEN',
          note: 'Report submitted with GPS.',
          isPublic: true,
        },
        {
          id: 'tl-1005-2',
          status: 'IN_PROGRESS',
          timestamp: oneHourAgo,
          actorName: 'Pooja Verma',
          actorRole: 'FIELD_TEAM',
          note: 'Portable de-watering pump deployed at site. Clearing blocked catch basin.',
          isPublic: true,
        },
      ],
    },
    {
      id: 'CS-2026-1006',
      title: 'Dark stretch - 4 consecutive broken streetlights near Clinic',
      description: 'Streetlights poles #12 to #15 have been non-functional for three nights. High security concern for women and hospital visitors walking late at night.',
      category: 'streetlight',
      aiSuggestedCategory: 'streetlight',
      aiCategoryConfidence: 91,
      location: {
        latitude: 28.6165,
        longitude: 77.2045,
        address: 'Subhash Marg, outside Primary Healthcare Center',
        landmark: 'Primary Healthcare Center Subhash Marg',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      photos: [
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      ],
      citizenId: 'usr-citizen-01',
      citizenName: 'Aarav Sharma',
      citizenPhone: '+91 98765 43210',
      createdAt: oneDayAgo,
      updatedAt: oneDayAgo,
      status: 'UNDER_REVIEW',
      priorityScore: calculatePriorityScore('streetlight', 1, oneDayAgo, 'Primary Healthcare Center'),
      timeline: [
        {
          id: 'tl-1006-1',
          status: 'SUBMITTED',
          timestamp: oneDayAgo,
          actorName: 'Aarav Sharma',
          actorRole: 'CITIZEN',
          note: 'Report submitted.',
          isPublic: true,
        },
        {
          id: 'tl-1006-2',
          status: 'UNDER_REVIEW',
          timestamp: oneDayAgo,
          actorName: 'Dr. Rajesh Kumar',
          actorRole: 'ADMIN',
          note: 'Verifying electrical grid junction maintenance schedule.',
          isPublic: true,
        },
      ],
    },
    {
      id: 'CS-2026-1007',
      title: 'Clean drinking water pipeline fracture gushing water',
      description: 'Fresh municipal drinking water pipeline burst underneath roadside paver blocks. Thousands of liters of water being wasted and creating mud pool.',
      category: 'water_supply',
      aiSuggestedCategory: 'water_supply',
      aiCategoryConfidence: 97,
      location: {
        latitude: 28.6110,
        longitude: 77.2130,
        address: 'Road #4, Crossway Colony',
        landmark: 'Near Crossway Community School',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      photos: [
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      ],
      citizenId: 'usr-citizen-05',
      citizenName: 'Ritu Sen',
      citizenPhone: '+91 98777 88990',
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
      status: 'SUBMITTED',
      priorityScore: calculatePriorityScore('water_supply', 1, oneHourAgo, 'Community School'),
      timeline: [
        {
          id: 'tl-1007-1',
          status: 'SUBMITTED',
          timestamp: oneHourAgo,
          actorName: 'Ritu Sen',
          actorRole: 'CITIZEN',
          note: 'New report submitted via mobile app.',
          isPublic: true,
        },
      ],
    },
  ];
}

function getInitialClusters(reports: Report[]): IssueCluster[] {
  const c1Reports = reports.filter((r) => r.clusterId === 'CLUSTER-2026-01');
  return [
    {
      id: 'CLUSTER-2026-01',
      title: 'MG Road Central Bus Depot Pothole Cluster',
      primaryCategory: 'pothole',
      reportCount: c1Reports.length,
      reportIds: c1Reports.map((r) => r.id),
      centerLocation: {
        latitude: 28.6140,
        longitude: 77.2091,
        address: 'MG Road, near Central Bus Depot Exit Gate & Signal',
        landmark: 'Central Bus Depot Gate 2',
        ward: 'Ward 14',
        city: 'New Delhi',
        isGpsVerified: true,
      },
      status: 'APPROVED',
      priorityScore: {
        totalScore: 84,
        level: 'CRITICAL',
        volumeFactor: 24, // 3 corroborated reports
        severityFactor: 26,
        vulnerabilityFactor: 24, // Bus Depot transit hub
        stalenessFactor: 10,
        reasoning: 'Critical multi-report cluster (3 distinct citizen submissions within 45m radius on major transit corridor). Requires unified asphalt remediation.',
      },
      aiConfidence: 91,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      assignedDepartment: 'Roads & Infrastructure Maintenance Division',
      reviewerNotes: 'Verified spatial overlap and photographic evidence. Coordinated cold-mix patching batch for night shift.',
    },
  ];
}

function getInitialDuplicates(): DuplicateCandidate[] {
  return [
    {
      reportId: 'CS-2026-1002',
      matchingReportId: 'CS-2026-1001',
      overallConfidence: 89,
      distanceMeters: 45,
      semanticSimilarity: 82,
      categoryMatch: true,
      imageSimilarity: 78,
      explanation: '45m distance on MG Road; 82% semantic overlap regarding asphalt damage near Bus Depot; both categorized as Pothole.',
      status: 'CONFIRMED_SAME_ISSUE',
    },
    {
      reportId: 'CS-2026-1003',
      matchingReportId: 'CS-2026-1001',
      overallConfidence: 86,
      distanceMeters: 28,
      semanticSimilarity: 76,
      categoryMatch: true,
      imageSimilarity: 75,
      explanation: '28m distance adjacent to Depot Signal; both describe deep vehicle hazard crater; candidate for joint work order.',
      status: 'CONFIRMED_SAME_ISSUE',
    },
  ];
}

function getInitialAuditLogs(): AuditLogEntry[] {
  const now = new Date();
  return [
    {
      id: 'aud-001',
      timestamp: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      actorId: 'usr-admin-01',
      actorName: 'Dr. Rajesh Kumar',
      actorRole: 'ADMIN',
      action: 'APPROVE_CLUSTER',
      targetType: 'CLUSTER',
      targetId: 'CLUSTER-2026-01',
      details: 'Approved AI suggested cluster linking reports CS-2026-1001, CS-2026-1002, and CS-2026-1003.',
    },
    {
      id: 'aud-002',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      actorId: 'usr-admin-01',
      actorName: 'Dr. Rajesh Kumar',
      actorRole: 'ADMIN',
      action: 'ASSIGN_DEPARTMENT',
      targetType: 'REPORT',
      targetId: 'CS-2026-1004',
      details: 'Assigned overflowing garbage issue to Solid Waste Rapid Action Unit (Inspector Pooja Verma).',
    },
    {
      id: 'aud-003',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      actorId: 'usr-field-01',
      actorName: 'Pooja Verma',
      actorRole: 'FIELD_TEAM',
      action: 'UPDATE_STATUS',
      targetType: 'REPORT',
      targetId: 'CS-2026-1005',
      details: 'Updated status to IN_PROGRESS. Deployed high-capacity diesel pump to Northern Railway Underpass.',
    },
  ];
}

function getInitialNotifications(): NotificationItem[] {
  const now = new Date();
  return [
    {
      id: 'notif-001',
      userId: 'usr-citizen-01',
      reportId: 'CS-2026-1001',
      title: 'Status Update: Report Grouped in Priority Cluster',
      message: 'Your report CS-2026-1001 has been connected with 2 other community reports into Cluster CLUSTER-2026-01. Priority raised to Critical.',
      timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      read: false,
      type: 'CLUSTER_ASSOCIATION',
    },
    {
      id: 'notif-002',
      userId: 'usr-citizen-01',
      reportId: 'CS-2026-1004',
      title: 'Action Update: Assigned to Field Team',
      message: 'Your report regarding garbage overflow at Mandi Gate has been dispatched to Solid Waste Rapid Action Unit.',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'STATUS_UPDATE',
    },
  ];
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, resetting to initial seed:', err);
      }
    }

    // Seed defaults
    const reports = getInitialReports();
    const schema: DatabaseSchema = {
      users: DEMO_USERS,
      reports,
      clusters: getInitialClusters(reports),
      duplicates: getInitialDuplicates(),
      auditLogs: getInitialAuditLogs(),
      notifications: getInitialNotifications(),
    };

    this.saveData(schema);
    return schema;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  // --- Reports ---
  getReports(): Report[] {
    return this.data.reports;
  }

  getReportById(id: string): Report | undefined {
    return this.data.reports.find((r) => r.id === id);
  }

  addReport(report: Report): Report {
    this.data.reports.unshift(report);
    this.saveData(this.data);
    return report;
  }

  updateReport(id: string, updates: Partial<Report>): Report | undefined {
    const idx = this.data.reports.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;

    this.data.reports[idx] = {
      ...this.data.reports[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveData(this.data);
    return this.data.reports[idx];
  }

  // --- Clusters ---
  getClusters(): IssueCluster[] {
    return this.data.clusters;
  }

  getClusterById(id: string): IssueCluster | undefined {
    return this.data.clusters.find((c) => c.id === id);
  }

  addCluster(cluster: IssueCluster): IssueCluster {
    this.data.clusters.unshift(cluster);
    this.saveData(this.data);
    return cluster;
  }

  updateCluster(id: string, updates: Partial<IssueCluster>): IssueCluster | undefined {
    const idx = this.data.clusters.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    this.data.clusters[idx] = {
      ...this.data.clusters[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveData(this.data);
    return this.data.clusters[idx];
  }

  // --- Duplicates ---
  getDuplicates(): DuplicateCandidate[] {
    return this.data.duplicates;
  }

  addDuplicate(dup: DuplicateCandidate): DuplicateCandidate {
    // Avoid duplicate pairs
    const exists = this.data.duplicates.some(
      (d) =>
        (d.reportId === dup.reportId && d.matchingReportId === dup.matchingReportId) ||
        (d.reportId === dup.matchingReportId && d.matchingReportId === dup.reportId)
    );
    if (!exists) {
      this.data.duplicates.unshift(dup);
      this.saveData(this.data);
    }
    return dup;
  }

  updateDuplicateStatus(
    reportId: string,
    matchingReportId: string,
    status: DuplicateCandidate['status']
  ): boolean {
    const dup = this.data.duplicates.find(
      (d) =>
        (d.reportId === reportId && d.matchingReportId === matchingReportId) ||
        (d.reportId === matchingReportId && d.matchingReportId === reportId)
    );
    if (dup) {
      dup.status = status;
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLogEntry[] {
    return this.data.auditLogs;
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(fullEntry);
    this.saveData(this.data);
    return fullEntry;
  }

  // --- Notifications ---
  getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.data.notifications.unshift(item);
    this.saveData(this.data);
    return item;
  }

  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Reset to initial demo state
  resetToDemo(): void {
    const reports = getInitialReports();
    this.data = {
      users: DEMO_USERS,
      reports,
      clusters: getInitialClusters(reports),
      duplicates: getInitialDuplicates(),
      auditLogs: getInitialAuditLogs(),
      notifications: getInitialNotifications(),
    };
    this.saveData(this.data);
  }
}

export const db = new Database();
