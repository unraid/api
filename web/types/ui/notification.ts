export interface NotificationItemProps {
  id: string;
  title: string;
  subject: string;
  description: string;
  importance: string;
  link: string;
  type: 'success' | 'warning' | 'alert';
  timestamp: string;
}
