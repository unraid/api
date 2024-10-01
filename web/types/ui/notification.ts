export interface NotificationItemProps {
  id: string;
  event: string;
  date: string;
  subject: string;
  message: string;
  type: 'success' | 'warning' | 'alert';
  view: string;
}