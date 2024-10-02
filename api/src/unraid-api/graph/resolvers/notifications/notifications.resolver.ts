import type {
    NotificationData,
    NotificationType,
    NotificationFilter,
    NotificationOverview,
} from '@app/graphql/generated/api/types';
import { Args, Mutation, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub';
import { NotificationsService } from './notifications.service';
import { Importance } from '@app/graphql/generated/client/graphql';
import { AppError } from '@app/core/errors/app-error';

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
            id: 'notifications',
        };
    }

    @ResolveField()
    public async overview() {
        return this.notificationsService.getOverview();
    }

    @ResolveField()
    public async list(
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
    public async archiveNotifications(@Args('ids') ids: string[]) {
        await this.notificationsService.archiveIds(ids);
        return this.notificationsService.getOverview();
    }

    @Mutation()
    public async archiveAll(@Args('importance') importance?: Importance): Promise<NotificationOverview> {
        const { overview } = await this.notificationsService.archiveAll(importance);
        return overview;
    }

    @Mutation()
    public unreadNotification(@Args('id') id: string) {
        return this.notificationsService.markAsUnread({ id });
    }

    @Mutation()
    public async unarchiveNotifications(@Args('ids') ids: string[]) {
        await this.notificationsService.unarchiveIds(ids);
        return this.notificationsService.getOverview();
    }

    @Mutation()
    public async unarchiveAll(@Args('importance') importance?: Importance): Promise<NotificationOverview> {
        const { overview } = await this.notificationsService.unarchiveAll(importance);
        return overview;
    }

    @Mutation()
    public async recalculateOverview() {
        const { overview, error } = await this.notificationsService.recalculateOverview();
        if (error) {
            throw new AppError("Failed to refresh overview", 500);
        }
        return overview;
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
