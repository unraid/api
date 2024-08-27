import { type NotificationFilter } from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';
import { Query, Resolver, Args, Subscription } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { UseRoles } from 'nest-access-control';
import { Logger } from '@nestjs/common';
import { PUBSUB_CHANNEL, createSubscription } from '@app/core/pubsub';

@Resolver()
export class NotificationsResolver {
    @Query()
    @UseRoles({
        resource: 'notifications',
        action: 'read',
        possession: 'any',
    })
    public async notifications(
        @Args('filter')
        { limit, importance, type, offset }: NotificationFilter
    ) {
        if (limit > 50) {
            throw new GraphQLError('Limit must be less than 50');
        }
        return Object.values(getters.notifications().notifications)
            .filter((notification) => {
                if (importance && importance !== notification.importance) {
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
            .slice(offset, limit + offset);
    }

    @Subscription('notificationAdded')
    @UseRoles({
        resource: 'notifications',
        action: 'read',
        possession: 'any',
    })
    async notificationAdded() {
        return createSubscription(PUBSUB_CHANNEL.NOTIFICATION);
    }
}
