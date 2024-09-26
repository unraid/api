export interface NotificationIni {
    timestamp: string;
    event: string;
    subject: string;
    description: string;
    importance: 'normal' | 'alert' | 'warning';
    link?: string;
}
