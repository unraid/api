import { getAllowedOrigins } from '@app/common/allowed-origins';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type MutationResolvers } from '@app/graphql/generated/api/types';
import { store } from '@app/store/index';
import { updateAllowedOrigins } from '@app/store/modules/config';

export const setAdditionalAllowedOrigins: MutationResolvers['setAdditionalAllowedOrigins'] =
    async (_, args, context) => {
        ensurePermission(context.user, {
            resource: 'connect',
            possession: 'own',
            action: 'update',
        });

        await store.dispatch(
            updateAllowedOrigins(args.input.origins)
        );

        return getAllowedOrigins();
    };
