import type { CoreContext, CoreResult } from '@app/core/types/index.js';
import { AppError } from '@app/core/errors/app-error.js';
import { FieldMissingError } from '@app/core/errors/field-missing-error.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission.js';
import { hasFields } from '@app/core/utils/validation/has-fields.js';
import { getters } from '@app/store/index.js';

interface Context extends CoreContext {
    params: {
        /** Name of user to delete. */
        name: string;
    };
}

/**
 * Delete user account.
 */
export const deleteUser = async (context: Context): Promise<CoreResult> => {
    // Check permissions

    const { params } = context;
    const { name } = params;
    const missingFields = hasFields(params, ['name']);

    if (missingFields.length !== 0) {
        // Just throw the first error
        throw new FieldMissingError(missingFields[0]);
    }

    // Check user exists
    if (!getters.emhttp().users.find((user) => user.name === name)) {
        throw new AppError('No user exists with this name.');
    }

    // Delete user
    await emcmd({
        userName: name,
        confirmDelete: 'on',
        cmdUserEdit: 'Delete',
    });

    return {
        text: 'User deleted successfully.',
    };
};
