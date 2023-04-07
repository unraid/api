import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { store } from '@app/store';
import { type ArrayResolvers } from '@app/graphql/generated/api/types';
import { getArrayData } from '@app/core/modules/array/get-array-data';

/**
 * Get array info.
 * @returns Array state and array/disk capacity.
 */
export const getArray: ArrayResolvers = (
    _,
    __,
    context
) => {
    const { user } = context;

    // Check permissions
    ensurePermission(user, {
        resource: 'array',
        action: 'read',
        possession: 'any',
    });

    return getArrayData(store.getState);
};
