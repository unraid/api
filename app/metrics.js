/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * The Graphql pm2 metrics reporters.
 */
module.exports = function ($injector) {
    const websocketClients = {
        name: 'Websocket clients',
        value: () => $injector.resolve('ws-clients').size
    };

    const memoryCaches = {
        name: 'Memory caches',
        value: () => {
            const caches = $injector.resolve('caches');
            const keys = caches.keys();

            // Return amount of caches that exist
            return keys.length;
        }
    };

    return {
        websocketClients,
        memoryCaches
    };
}