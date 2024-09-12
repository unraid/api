import {type NotificationFilter} from '@app/graphql/generated/api/types';
import {Args, Query, ResolveField, Resolver, Subscription} from '@nestjs/graphql';
import {UseRoles} from 'nest-access-control';
import {createSubscription, PUBSUB_CHANNEL} from '@app/core/pubsub';
import {NotificationsService} from './notifications.service';
import { getServerIdentifier } from '@app/core/utils/server-identifier';

@Resolver('Notifications')
export class NotificationsResolver {
    constructor(readonly notificationsService: NotificationsService) {}

    @Query()
    @UseRoles({
        resource: 'notifications',
        action: 'read',
        possession: 'any',
    })
    public async notifications() {
        return {
            id: getServerIdentifier('notifications'),
        }
    }

    @ResolveField()
    public async overview() {
        return await this.notificationsService.getOverview();
    }


    @ResolveField()
    public async data(
        @Args('filter')
        filters: NotificationFilter
    ) {
        return await this.notificationsService.getNotifications(filters);
    }

    @Subscription()
    @UseRoles({
        resource: 'notifications',
        action: 'read',
        possession: 'any',
    })
    async notificationAdded() {
        return createSubscription(PUBSUB_CHANNEL.NOTIFICATION_ADDED);
    }

    @Subscription()
    @UseRoles({
        resource: 'notifications',
        action: 'read',
        possession: 'any',
    })
    async notificationsOverview() {
        return createSubscription(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW);
    }
}
