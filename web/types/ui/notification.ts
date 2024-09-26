export interface NotificationItemProps {
  date: string;
  event: string;
  id: string;
  message: string;
  subject: string;
  type: 'success' | 'warning' | 'alert';
  view?: string;
}