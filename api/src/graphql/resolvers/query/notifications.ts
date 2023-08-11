import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type QueryResolvers } from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';

export const notificationsResolver: QueryResolvers['notifications'] = async (
    _,
    { filter: { offset, limit, importance, type } },
    context
) => {
    ensurePermission(context.user, {
        possession: 'any',
        resource: 'notifications',
        action: 'read',
    });

    if (limit > 50) {
        throw new Error('Limit must be less than 50');
    }
    return Object.values(getters.notifications().notifications)
        .filter((notification) => {
            if (
                importance &&
                importance !== notification.importance
            ) {
                return false;
            }
            if (type && type !== notification.type) {
                return false;
            }

            return true;
        })
        .sort(
            (a, b) =>
                new Date(b.timestamp ?? 0).getTime() -
                new Date(a.timestamp ?? 0).getTime()
        )
        .slice(
            offset,
            limit + offset
        );
};
