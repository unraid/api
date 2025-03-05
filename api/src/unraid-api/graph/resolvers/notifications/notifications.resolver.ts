import { Args, Mutation, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type {
    NotificationData,
    NotificationFilter,
    NotificationOverview,
} from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { AppError } from '@app/core/errors/app-error.js';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { NotificationType, Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { Importance } from '@app/unraid-api/plugins/connect/api/graphql/generated/client/graphql.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

@Resolver('Notifications')
export class NotificationsResolver {
    constructor(readonly notificationsService: NotificationsService) {}

    /**============================================
     *               Queries
     *=============================================**/

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.NOTIFICATIONS,
        possession: AuthPossession.ANY,
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
    public async deleteArchivedNotifications(): Promise<NotificationOverview> {
        return this.notificationsService.deleteNotifications(NotificationType.ARCHIVE);
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
    public async unarchiveAll(
        @Args('importance') importance?: Importance
    ): Promise<NotificationOverview> {
        const { overview } = await this.notificationsService.unarchiveAll(importance);
        return overview;
    }

    @Mutation()
    public async recalculateOverview() {
        const { overview, error } = await this.notificationsService.recalculateOverview();
        if (error) {
            throw new AppError('Failed to refresh overview', 500);
        }
        return overview;
    }

    /**============================================
     *               Subscriptions
     *=============================================**/

    @Subscription()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.NOTIFICATIONS,
        possession: AuthPossession.ANY,
    })
    async notificationAdded() {
        return createSubscription(PUBSUB_CHANNEL.NOTIFICATION_ADDED);
    }

    @Subscription()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.NOTIFICATIONS,
        possession: AuthPossession.ANY,
    })
    async notificationsOverview() {
        return createSubscription(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW);
    }
}
