import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type QueryResolvers } from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';

export const notificationsResolver: QueryResolvers['notifications'] = async (
    _,
    args,
    context
) => {
    ensurePermission(context.user, {
        possession: 'any',
        resource: 'notifications',
        action: 'read',
    });

    return Object.values(getters.notifications().notifications)
        .filter((notification) => {
            if (args.filter) {
                if (
                    args.filter.importance &&
                    args.filter.importance !== notification.importance
                ) {
                    return false;
                }
                if (
                    args.filter.type &&
                    args.filter.type !== notification.type
                ) {
                    return false;
                }
            }
            return true;
        })
        .sort(
            (a, b) =>
                new Date(b.timestamp ?? 0).getTime() -
                new Date(a.timestamp ?? 0).getTime()
        );
};
