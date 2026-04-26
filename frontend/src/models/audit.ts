export type AuditActivity = {
  id: string;
  occurredAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  actionType: string;
  actionLabel: string;
  category: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type AuditTrendPoint = {
  date: string;
  label: string;
  count: number;
};

export type AuditUserFilter = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AuditActionFilter = {
  value: string;
  label: string;
};

export type AuditStats = {
  total: number;
  uniqueUsers: number;
  authActivities: number;
  reclamationActivities: number;
  last24Hours: number;
};

export type AuditActivitiesPayload = {
  items: AuditActivity[];
  total: number;
  stats: AuditStats;
  trend: AuditTrendPoint[];
  users: AuditUserFilter[];
  actionTypes: AuditActionFilter[];
};
