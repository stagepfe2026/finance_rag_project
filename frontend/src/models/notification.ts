export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  items: NotificationItem[];
  total: number;
};

export type NotificationSocketEvent = {
  event: "notification.created";
  data: NotificationItem;
};
