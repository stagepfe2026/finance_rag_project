export interface QuickAction {
  id: number;
  title: string;
  description: string;
  link: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
}

export interface DocumentItem {
  id: number;
  title: string;
  category: string;
  date: string;
  link: string;
}

export interface QuickAccessItem {
  id: number;
  label: string;
  link: string;
}