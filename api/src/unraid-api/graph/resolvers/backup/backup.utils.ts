export const BACKUP_JOB_GROUP_PREFIX = 'backup-';

/**
 * Generates the group ID for a backup job based on its configuration ID.
 * This group ID is used by RClone to group related backup operations.
 * @param configId The ID of the backup job configuration.
 * @returns The RClone group ID string.
 */
export function getBackupJobGroupId(configId: string): string {
    return `${BACKUP_JOB_GROUP_PREFIX}${configId}`;
}

/**
 * Extracts the configuration ID from a backup job group ID.
 * @param groupId The RClone group ID string (e.g., "backup-someConfigId").
 * @returns The configuration ID if the group ID is valid and prefixed, otherwise undefined.
 */
export function getConfigIdFromGroupId(groupId: string): string | undefined {
    if (groupId.startsWith(BACKUP_JOB_GROUP_PREFIX)) {
        return groupId.substring(BACKUP_JOB_GROUP_PREFIX.length);
    }
    return undefined;
}

/**
 * Checks if the given ID corresponds to a backup job group.
 * @param id The ID string to check (can be a job ID or a group ID).
 * @returns True if the ID represents a backup job group, false otherwise.
 */
export function isBackupJobGroup(id: string): boolean {
    return id.startsWith(BACKUP_JOB_GROUP_PREFIX);
}
