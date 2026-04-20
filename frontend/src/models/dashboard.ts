import type { DocumentItem } from "./document";
import type { NotificationItem } from "./notification";

export type UserDashboard = {
  userName: string;
  recentDocuments: DocumentItem[];
  notifications: NotificationItem[];
};
