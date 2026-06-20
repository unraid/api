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
    /**
     * Per-page-load generation stamp for JS-sourced banner notifications (keys prefixed
     * 'banner-'). The page re-raises active banners on every load with the current
     * generation; reconcileBannerNotifications clears any 'banner-' entry whose gen no
     * longer matches, i.e. one the producer stopped rendering.
     */
    gen?: string;
}
