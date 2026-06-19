export interface NotificationIni {
    timestamp: string;
    event: string;
    subject: string;
    description: string;
    importance: 'normal' | 'alert' | 'warning';
    link?: string;
    /** Stable producer key for condition-style notifications (idempotent raise / clear-by-key). */
    key?: string;
    /** 'true' when the notification is persistent (not user-archivable). Stored as a string in the ini file. */
    persistent?: string;
}
