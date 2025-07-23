export interface SsoUserService {
    /**
     * Get the current list of SSO user IDs
     * @returns Array of SSO user IDs
     */
    getSsoUsers(): Promise<string[]>;

    /**
     * Set the complete list of SSO user IDs
     * @param userIds - The list of SSO user IDs to set
     * @returns true if a restart is required, false otherwise
     */
    setSsoUsers(userIds: string[]): Promise<boolean>;
}
