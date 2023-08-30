import { PermissionError } from '@app/core/errors/permission-error';
import { type User } from '@app/core/types/states/user';
import {
    checkPermission,
    type AccessControlOptions,
} from '@app/core/utils/permissions/check-permission';
import { logger } from '@app/core/log';
import { BYPASS_PERMISSION_CHECKS, NODE_ENV } from '@app/environment';

/**
 * Ensure the user has the correct permissions.
 * @param user The user to check permissions on.
 * @param options A permissions object.
 */
export const ensurePermission = (
    user: User | undefined,
    options: AccessControlOptions
) => {
    const { resource, action, possession = 'own' } = options;

    // Bail if no user was passed
    if (!user)
        throw new PermissionError(
            `No user provided for authentication check when trying to access "${resource}".`
        );

    const permissionGranted = checkPermission(user, {
        resource,
        action,
        possession,
    });

    if (
        NODE_ENV === 'development' &&
        BYPASS_PERMISSION_CHECKS === true &&
        !permissionGranted
    ) {
        logger.warn(
            `BYPASSING_PERMISSION_CHECK: ${user.name} doesn't have permission to access "${resource}".`
        );
        return;
    }

    // Bail if user doesn't have permission
    if (!permissionGranted)
        throw new PermissionError(
            `${user.name} doesn't have permission to access "${resource}".`
        );
};
