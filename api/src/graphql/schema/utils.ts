import { AppError } from '@app/core/errors/app-error.js';
import { graphqlLogger } from '@app/core/log.js';
import { pubsub } from '@app/core/pubsub.js';
import { type User } from '@app/core/types/states/user.js';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission.js';
import { store } from '@app/store/index.js';
import { MinigraphStatus } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';
import { Server, ServerStatus } from '@app/unraid-api/graph/resolvers/servers/server.model.js';

export interface Context {
    user?: User;
    websocketId: string;
}

type Subscription = {
    total: number;
    channels: string[];
};

const subscriptions: Record<string, Subscription> = {};

/**
 * Return current ws connection count.
 */
export const getWsConnectionCount = () =>
    Object.values(subscriptions).filter((subscription) => subscription.total >= 1).length;

/**
 * Return current ws connection count in channel.
 */
export const getWsConnectionCountInChannel = (channel: string) =>
    Object.values(subscriptions).filter((subscription) => subscription.channels.includes(channel))
        .length;

export const hasSubscribedToChannel = (id: string, channel: string) => {
    graphqlLogger.debug('Subscribing to %s', channel);

    // Setup initial object
    if (subscriptions[id] === undefined) {
        subscriptions[id] = {
            total: 1,
            channels: [channel],
        };
        return;
    }

    subscriptions[id].total++;
    subscriptions[id].channels.push(channel);
};

/**
 * Create a pubsub subscription.
 * @param channel The pubsub channel to subscribe to.
 * @param resource The access-control permission resource to check against.
 */
export const createSubscription = (channel: string, resource?: string) => ({
    subscribe(_: unknown, __: unknown, context: Context) {
        if (!context.user) {
            throw new AppError('<ws> No user found in context.', 500);
        }

        // Check the user has permission to subscribe to this endpoint
        ensurePermission(context.user, {
            resource: resource ?? channel,
            action: 'read',
            possession: 'any',
        });

        hasSubscribedToChannel(context.websocketId, channel);
        return pubsub.asyncIterableIterator(channel);
    },
});

export const getLocalServer = (getState = store.getState): Array<Server> => {
    const { emhttp, config, minigraph } = getState();
    const guid = emhttp.var.regGuid;
    const { name } = emhttp.var;
    const wanip = '';
    const lanip: string = emhttp.networks[0].ipaddr[0];
    const port = emhttp.var?.port;
    const localurl = `http://${lanip}:${port}`;
    const remoteurl = '';

    return [
        {
            id: 'local',
            owner: {
                id: 'local',
                username: config.remote.username ?? 'root',
                url: '',
                avatar: '',
            },
            guid,
            apikey: config.remote.apikey ?? '',
            name: name ?? 'Local Server',
            status:
                minigraph.status === MinigraphStatus.CONNECTED
                    ? ServerStatus.ONLINE
                    : ServerStatus.OFFLINE,
            wanip,
            lanip,
            localurl,
            remoteurl,
        },
    ];
};

export const getServers = (getState = store.getState): Server[] => {
    // Check if we have the servers already cached, if so return them
    return getLocalServer(getState) ?? [];
};
