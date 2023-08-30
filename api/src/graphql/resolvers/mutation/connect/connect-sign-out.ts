import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type MutationResolvers } from '@app/graphql/generated/api/types';
import { store } from '@app/store/index';
import { logoutUser, signOut } from '@app/store/modules/config';

export const connectSignOut: MutationResolvers['connectSignOut'] = async (
    _,
    __,
    context
) => {
    ensurePermission(context.user, {
        resource: 'connect',
        possession: 'own',
        action: 'update',
    });

    store.dispatch(signOut());
    await store.dispatch(logoutUser({ reason: 'Manual Sign Out With API' }));
    return true;
};
