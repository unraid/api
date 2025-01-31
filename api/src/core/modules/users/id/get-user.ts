import type { CoreContext, CoreResult } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { ensureParameter } from '@app/core/utils/validation/context';
import { getters } from '@app/store';

interface Context extends CoreContext {
    params: {
        /** User ID */
        id: string;
    };
}

/**
 * Get single user.
 * @returns The selected user.
 */
export const getUser = async (context: Context): Promise<CoreResult> => {
    // Check permissions
    ensurePermission(context.user, {
        resource: 'user',
        action: 'create',
        possession: 'any',
    });

    ensureParameter(context, 'id');

    const id = context?.params?.id;
    if (!id) {
        throw new AppError('No id passed.');
    }

    const user = getters.emhttp().users.find((user) => user.id === id);

    if (!user) {
        // This is likely a new install or something went horribly wrong
        throw new AppError(`No users found matching ${id}`, 404);
    }

    return {
        text: `User: ${JSON.stringify(user, null, 2)}`,
        json: user,
    };
};
