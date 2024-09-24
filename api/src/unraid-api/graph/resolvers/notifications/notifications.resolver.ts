import type {
    NotificationData,
    NotificationType,
    NotificationFilter,
} from '@app/graphql/generated/api/types';
import { Args, Mutation, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub';
import { NotificationsService } from './notifications.service';
import { getServerIdentifier } from '@app/core/utils/server-identifier';

@Resolver('Notifications')
export class NotificationsResolver {
    constructor(readonly notificationsService: NotificationsService) {}

    /**============================================
     *               Queries
     *=============================================**/

    @Query()
    @UseRoles({
        resource: 'notifications',
        action: 'read',
        possession: 'any',
    })
    public async notifications() {
        return {
            id: getServerIdentifier('notifications'),
        };
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

    /**============================================
     *               Mutations
     *=============================================**/

    /** Creates a new notification record */
    @Mutation()
    public createNotification(
        @Args('input')
        data: NotificationData
    ) {
        return this.notificationsService.createNotification(data);
    }

    @Mutation()
    public async deleteNotification(
        @Args('id')
        id: string,
        @Args('type')
        type: NotificationType
    ) {
        const { overview } = await this.notificationsService.deleteNotification({ id, type });
        return overview;
    }

    @Mutation()
    public archiveNotification(@Args('id') id: string) {
        return this.notificationsService.archiveNotification({ id });
    }

    @Mutation()
    public unreadNotification(@Args('id') id: string) {
        return this.notificationsService.markAsUnread({ id });
    }

    /**============================================
     *               Subscriptions
     *=============================================**/

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
