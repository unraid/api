import { type User } from '@app/core/types/states/user';
import {
} from '@app/core/utils/permissions/check-permission';

/**
 * @deprecated Use casbin auth in nest instead
 */
export const ensurePermission = (
    user: User | undefined,
    options: any
) => {
    // Stub for now
    return false;
};
