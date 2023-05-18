/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { PUBSUB_CHANNEL, pubsub } from '@app/core/pubsub';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Resolvers } from '@app/graphql/generated/api/types';
import { createSubscription } from '@app/graphql/schema/utils';

export const Subscription: Resolvers['Subscription'] = {
    display: {
        ...createSubscription('display'),
    },
    apikeys: {
        // Not sure how we're going to secure this
        // ...createSubscription('apikeys')
    },
    config: {
        ...createSubscription('config'),
    },
    array: {
        ...createSubscription('array'),
    },
    dockerContainers: {
        ...createSubscription('docker/container'),
    },
    dockerNetworks: {
        ...createSubscription('docker/network'),
    },
    notificationAdded: {
        subscribe: (_parent, _args, context) => {
            ensurePermission(context.user, {
                possession: 'any',
                resource: 'notifications',
                action: 'read',
            });
            return {
                [Symbol.asyncIterator]: () =>
                    pubsub.asyncIterator(PUBSUB_CHANNEL.NOTIFICATION),
            };
        },
    },
    info: {
        ...createSubscription('info'),
    },
    servers: {
        ...createSubscription('servers'),
    },
    shares: {
        ...createSubscription('shares'),
    },
    unassignedDevices: {
        ...createSubscription('devices/unassigned'),
    },
    users: {
        ...createSubscription('users'),
    },
    vars: {
        ...createSubscription('vars'),
    },
    vms: {
        ...createSubscription('vms'),
    },
    registration: {
        ...createSubscription('registration'),
    },
    online: {
        ...createSubscription('online'),
    },
    owner: {
        ...createSubscription('owner'),
    },
};
