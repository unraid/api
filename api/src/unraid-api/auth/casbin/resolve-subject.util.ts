import { UnauthorizedException } from '@nestjs/common';

type CasbinUser = {
    id?: unknown;
    roles?: unknown;
};

/**
 * Determine the Casbin subject for a request user.
 *
 * Prefers a non-empty `user.id`, otherwise falls back to a single non-empty role.
 * Throws when the subject cannot be resolved.
 */
export function resolveSubjectFromUser(user: CasbinUser | undefined): string {
    if (!user) {
        throw new UnauthorizedException('Request user context missing');
    }

    const roles = user.roles ?? [];

    if (!Array.isArray(roles)) {
        throw new UnauthorizedException('User roles must be an array');
    }

    const userId = typeof user.id === 'string' ? user.id.trim() : '';

    if (userId.length > 0) {
        return userId;
    }

    if (roles.length === 1) {
        const [role] = roles;

        if (typeof role === 'string') {
            const trimmedRole = role.trim();

            if (trimmedRole.length > 0) {
                return trimmedRole;
            }
        }

        throw new UnauthorizedException('Role subject must be a non-empty string');
    }

    throw new UnauthorizedException('Unable to determine subject from user context');
}
