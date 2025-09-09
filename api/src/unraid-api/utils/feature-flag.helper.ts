import { ForbiddenException } from '@nestjs/common';

/**
 * Checks if a feature flag is enabled and throws an exception if disabled.
 * Use this at the beginning of resolver methods for immediate feature flag checks.
 *
 * @example
 * ```typescript
 * @ResolveField(() => String)
 * async organizer() {
 *     checkFeatureFlag(FeatureFlags, 'ENABLE_NEXT_DOCKER_RELEASE');
 *     return this.dockerOrganizerService.resolveOrganizer();
 * }
 * ```
 *
 * @param flags - The feature flag object containing boolean/truthy values
 * @param key - The key within the feature flag object to check
 * @throws ForbiddenException if the feature flag is disabled
 */
export function checkFeatureFlag<T extends Record<string, any>>(flags: T, key: keyof T): void {
    const isEnabled = Boolean(flags[key]);

    if (!isEnabled) {
        throw new ForbiddenException(
            `Feature "${String(key)}" is currently disabled. This functionality is not available at this time.`
        );
    }
}
