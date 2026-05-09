export type AdminDashboardSummary = {
  documentsIndexed: number;
  documentsTotal: number;
  reclamationsTotal: number;
  reclamationsUrgent: number;
  activeUsers: number;
  pendingReclamations: number;
};

export type AdminDashboardReclamationBreakdown = {
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
};

export type AdminDashboardDocumentBreakdown = {
  indexed: number;
  processing: number;
  failed: number;
};

export type AdminDashboardTrendPoint = {
  date: string;
  label: string;
  documents: number;
  reclamations: number;
};

export type AdminDashboardIndexedDocument = {
  id: string;
  title: string;
  category: string;
  documentStatus: string;
  createdAt: string;
  indexedAt: string | null;
  fileType: string;
  publicationDate: string | null;
  effectiveDate: string | null;
  chunksCount: number | null;
};

export type AdminDashboardLatestAccess = {
  userId: string;
  userName: string;
  email: string;
  role: string;
  lastActivityAt: string;
  authMethod: string;
  imageProfileUrl: string;
};

export type AdminDashboardUrgentCase = {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  status: string;
  userEmail: string;
  createdAt: string;
};

export type AdminDashboardSlaStats = {
  overdueCount: number;
  dueSoonCount: number;
  urgentPendingCount: number;
  respectRate: number;
  avgHandleTimeMinutes: number;
};

export type AdminDashboard = {
  summary: AdminDashboardSummary;
  reclamationBreakdown: AdminDashboardReclamationBreakdown;
  documentBreakdown: AdminDashboardDocumentBreakdown;
  trend: AdminDashboardTrendPoint[];
  recentIndexedDocuments: AdminDashboardIndexedDocument[];
  latestAccess: AdminDashboardLatestAccess[];
  urgentCases: AdminDashboardUrgentCase[];
  slaStats?: AdminDashboardSlaStats;
};
