export interface QuickAction {
  id: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  link?: string | null;
  isRead?: boolean;
}

export interface RecentDocumentItem {
  id: string;
  title: string;
  category: string;
  date: string;
  link: string;
}

export interface QuickAccessItem {
  id: string;
  label: string;
  link: string;
}
