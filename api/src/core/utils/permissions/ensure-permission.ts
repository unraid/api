import { type User } from '@app/core/types/states/user.js';

import '@app/core/utils/permissions/check-permission.js';

/**
 * @deprecated Use casbin auth in nest instead
 */
export const ensurePermission = (user: User | undefined, options: any) => {
    // Stub for now
    return false;
};
