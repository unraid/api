// Sets up global pubsub dependencies

/**------------------------------------------------------------------------
 *                             PubSub in the Unraid API
 *
 *  There are 2 Event Buses in the Unraid API:
 *  1. GraphQL PubSub (for transport events between the client and server)
 *  2. EventEmitter PubSub (for domain events within nestjs)
 *
 * By separating the buses, we can separate backend logic and processing from
 * the actual data transport.
 *
 * e.g. we can process an event, and then transport it via one or more of
 * email, sms, discord, graphql subscription, etc without mixing all the
 * effects together.
 *------------------------------------------------------------------------**/

import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { GRAPHQL_PUBSUB_TOKEN } from '@unraid/shared/pubsub/graphql.pubsub.js';

import { pubsub } from '@app/core/pubsub.js';

@Global()
@Module({
    imports: [
        /**-----------------------
         *     Domain Event Bus
         *
         *  Used for backend events within the API.
         * e.g. User Logout, API key modified, etc.
         *------------------------**/
        EventEmitterModule.forRoot({
            // allow event handlers to subscribe to multiple events
            wildcard: true,
            // additional details when an unexpectedly high number of listeners are registered
            verboseMemoryLeak: true,
        }),
    ],
    providers: [
        /**-----------------------
         *     GraphQL Event Bus
         *
         *  Used for transport events between the client and server.
         * e.g. Notification added,
         *------------------------**/
        {
            provide: GRAPHQL_PUBSUB_TOKEN,
            useValue: pubsub,
        },
    ],
    exports: [GRAPHQL_PUBSUB_TOKEN, EventEmitterModule],
})
export class PubSubModule {}
