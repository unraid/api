import { Args, Mutation, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { AppError } from '@app/core/errors/app-error.js';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    Notification,
    NotificationData,
    NotificationFilter,
    NotificationImportance,
    NotificationJob,
    NotificationOverview,
    Notifications,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

@Resolver(() => Notifications)
export class NotificationsResolver {
    constructor(readonly notificationsService: NotificationsService) {}

    /**============================================
     *               Queries
     *=============================================**/

    @Query(() => Notifications, { description: 'Get all notifications' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.NOTIFICATIONS,
    })
    public async notifications(): Promise<Notifications> {
        return {
            id: 'notifications',
        } as Notifications;
    }

    @ResolveField(() => NotificationOverview)
    public async overview(): Promise<NotificationOverview> {
        return this.notificationsService.getOverview();
    }

    @ResolveField(() => NotificationJob, { nullable: true })
    public job(@Args('id') jobId: string): NotificationJob {
        return this.notificationsService.getJob(jobId);
    }

    @ResolveField(() => [Notification])
    public async list(
        @Args('filter', { type: () => NotificationFilter })
        filters: NotificationFilter
    ): Promise<Notification[]> {
        return await this.notificationsService.getNotifications(filters);
    }

    /**============================================
     *               Mutations
     *=============================================**/

    @Mutation(() => Notification, { description: 'Creates a new notification record' })
    public createNotification(
        @Args('input', { type: () => NotificationData })
        data: NotificationData
    ): Promise<Notification> {
        return this.notificationsService.createNotification(data);
    }

    @Mutation(() => NotificationOverview)
    public async deleteNotification(
        @Args('id', { type: () => PrefixedID })
        id: string,
        @Args('type', { type: () => NotificationType })
        type: NotificationType
    ): Promise<NotificationOverview> {
        const { overview } = await this.notificationsService.deleteNotification({ id, type });
        return overview;
    }

    @Mutation(() => NotificationOverview, {
        description: 'Deletes all archived notifications on server.',
    })
    public async deleteArchivedNotifications(): Promise<NotificationOverview> {
        return this.notificationsService.deleteNotifications(NotificationType.ARCHIVE);
    }

    @Mutation(() => Notification, { description: 'Marks a notification as archived.' })
    public archiveNotification(
        @Args('id', { type: () => PrefixedID })
        id: string
    ): Promise<Notification> {
        return this.notificationsService.archiveNotification({ id });
    }

    @Mutation(() => NotificationOverview)
    public async archiveNotifications(
        @Args('ids', { type: () => [PrefixedID] })
        ids: string[]
    ): Promise<NotificationOverview> {
        await this.notificationsService.archiveIds(ids);
        return this.notificationsService.getOverview();
    }

    @Mutation(() => NotificationOverview)
    public async archiveAll(
        @Args('importance', { type: () => NotificationImportance, nullable: true })
        importance?: NotificationImportance
    ): Promise<NotificationOverview> {
        const { overview } = await this.notificationsService.archiveAll(importance);
        return overview;
    }

    @Mutation(() => Notification, { description: 'Marks a notification as unread.' })
    public unreadNotification(
        @Args('id', { type: () => PrefixedID })
        id: string
    ): Promise<Notification> {
        return this.notificationsService.markAsUnread({ id });
    }

    @Mutation(() => NotificationOverview)
    public async unarchiveNotifications(
        @Args('ids', { type: () => [PrefixedID] })
        ids: string[]
    ): Promise<NotificationOverview> {
        await this.notificationsService.unarchiveIds(ids);
        return this.notificationsService.getOverview();
    }

    @Mutation(() => NotificationOverview)
    public async unarchiveAll(
        @Args('importance', { type: () => NotificationImportance, nullable: true })
        importance?: NotificationImportance
    ): Promise<NotificationOverview> {
        const { overview } = await this.notificationsService.unarchiveAll(importance);
        return overview;
    }

    @Mutation(() => NotificationOverview, {
        description: 'Reads each notification to recompute & update the overview.',
    })
    public async recalculateOverview(): Promise<NotificationOverview> {
        const { overview, error } = await this.notificationsService.recalculateOverview();
        if (error) {
            throw new AppError('Failed to refresh overview', 500);
        }
        return overview;
    }

    /**============================================
     *               Subscriptions
     *=============================================**/

    @Subscription(() => Notification)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.NOTIFICATIONS,
    })
    async notificationAdded() {
        return createSubscription(PUBSUB_CHANNEL.NOTIFICATION_ADDED);
    }

    @Subscription(() => NotificationOverview)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.NOTIFICATIONS,
    })
    async notificationsOverview() {
        return createSubscription(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW);
    }
}
