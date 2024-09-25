export interface NotificationItemProps {
  id: string;
  subject: string;
  message: string;
  type: 'success' | 'warning' | 'alert';
}