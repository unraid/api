import { type NotificationFilter } from '@app/graphql/generated/api/types';
import { Query, Resolver, Args, Subscription } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';
import { PUBSUB_CHANNEL, createSubscription } from '@app/core/pubsub';
import { NotificationsService } from './notifications.service';

@Resolver()
export class NotificationsResolver {
    constructor(readonly notificationsService: NotificationsService) {}

    @Query()
    @UseRoles({
        resource: 'notifications',
        action: 'read',
        possession: 'any',
    })
    public async notifications(
        @Args('filter')
        filters: NotificationFilter
    ) {
        await this.notificationsService.getNotifications(filters);
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
