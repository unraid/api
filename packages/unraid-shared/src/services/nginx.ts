export interface NginxService {
    /**
     * Reloads nginx via its rc script
     * @returns true if the reload was successful, false otherwise
     */
    reload(): Promise<boolean>;
}