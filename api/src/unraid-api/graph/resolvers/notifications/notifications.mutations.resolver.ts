import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { AppError } from '@app/core/errors/app-error.js';
import {
    NotificationImportance,
    NotificationJob,
    NotificationJobState,
    NotificationMutations,
    NotificationOverview,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

@Resolver(() => NotificationMutations)
export class NotificationMutationsResolver {
    constructor(private readonly notificationsService: NotificationsService) {}

    @ResolveField(() => NotificationOverview)
    @UsePermissions({
        action: AuthAction.DELETE_ANY,
        resource: Resource.NOTIFICATIONS,
    })
    public async delete(
        @Args('id', { type: () => PrefixedID }) id: string,
        @Args('type', { type: () => NotificationType }) type: NotificationType
    ): Promise<NotificationOverview> {
        const { overview } = await this.notificationsService.deleteNotification({ id, type });
        return overview;
    }

    @ResolveField(() => NotificationJob)
    @UsePermissions({
        action: AuthAction.DELETE_ANY,
        resource: Resource.NOTIFICATIONS,
    })
    public async startArchiveAll(
        @Args('importance', { type: () => NotificationImportance, nullable: true })
        importance?: NotificationImportance
    ): Promise<NotificationJob> {
        return this.notificationsService.startArchiveAllJob(importance);
    }

    @ResolveField(() => NotificationJob)
    @UsePermissions({
        action: AuthAction.DELETE_ANY,
        resource: Resource.NOTIFICATIONS,
    })
    public async startDeleteAll(
        @Args('type', { type: () => NotificationType, nullable: true }) type?: NotificationType
    ): Promise<NotificationJob> {
        const job = await this.notificationsService.startDeleteAllJob(type);
        if (job.state === NotificationJobState.FAILED) {
            throw new AppError(job.error ?? 'Failed to delete notifications', 500);
        }
        return job;
    }
}
