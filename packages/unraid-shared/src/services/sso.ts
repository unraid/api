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

    /**
     * Add a single SSO user ID
     * @param userId - The SSO user ID to add
     * @returns true if a restart is required, false otherwise
     */
    addSsoUser(userId: string): Promise<boolean>;

    /**
     * Remove a single SSO user ID
     * @param userId - The SSO user ID to remove
     * @returns true if a restart is required, false otherwise
     */
    removeSsoUser(userId: string): Promise<boolean>;

    /**
     * Remove all SSO users
     * @returns true if a restart is required, false otherwise
     */
    removeAllSsoUsers(): Promise<boolean>;
}
