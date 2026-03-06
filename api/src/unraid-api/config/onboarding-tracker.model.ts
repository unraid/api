/**
 * Simplified onboarding tracker state.
 * Tracks whether onboarding has been completed and at which version.
 */
export type TrackerState = {
    /** Whether the onboarding flow has been completed */
    completed?: boolean;
    /** The OS version when onboarding was completed (for future upgrade detection) */
    completedAtVersion?: string;
};
