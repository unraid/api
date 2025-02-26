import type { CoreContext, CoreResult } from '@app/core/types/index.js';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version.js';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission.js';

/**
 * Get welcome message.
 * @returns Welcomes a user.
 */
export const getWelcome = async (context: CoreContext): Promise<CoreResult> => {
    const { user } = context;

    // Bail if the user doesn't have permission
    ensurePermission(user, {
        resource: 'welcome',
        action: 'read',
        possession: 'any',
    });

    const version = await getUnraidVersion();
    const message = `Welcome ${user.name} to this Unraid ${version} server`;

    return {
        text: message,
        json: {
            message,
        },
    };
};
