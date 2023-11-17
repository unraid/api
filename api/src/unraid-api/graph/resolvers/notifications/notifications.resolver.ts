import { type NotificationFilter } from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';
import { Query, Resolver, Args, Mutation } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { UseRoles } from 'nest-access-control';
import { Logger } from '@nestjs/common';
import { type NotificationInput } from '@app/graphql/generated/client/graphql';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { SEND_NOTIFICATION_MUTATION } from '@app/graphql/mothership/mutations';

@Resolver()
export class NotificationsResolver {
    private logger = new Logger(NotificationsResolver.name);
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

    @Mutation('sendNotification')
    @UseRoles({
        resource: 'notifications',
        action: 'create',
        possession: 'own',
    })
    public async sendNotification(
        @Args('notification') notification: NotificationInput
    ) {
        this.logger.log('Sending notification', JSON.stringify(notification));
        const promise = new Promise((res, rej) => {
            setTimeout(async () => {
                rej(new GraphQLError('Sending Notification Timeout'));
            }, 5_000);
            const client = GraphQLClient.getInstance();
            // If there's no mothership connection then bail
            if (!client) {
                this.logger.error('Mothership is not working');
                throw new GraphQLError('Mothership is down');
            }
            client
                .query({
                    query: SEND_NOTIFICATION_MUTATION,
                    variables: {
                        notification: notification,
                        apiKey: getters.config().remote.apikey,
                    },
                })
                .then((result) => {
                    this.logger.debug(
                        'Query Result from Notifications.ts',
                        result
                    );
                    res(notification);
                })
                .catch((err) => {
                    rej(err);
                });
        });

        return promise;
    }
}
