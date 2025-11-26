import { Injectable } from '@nestjs/common';

import { GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';

import { createSubscription } from '@app/core/pubsub.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

/**
 * High-level helper service for creating GraphQL subscriptions with automatic cleanup.
 *
 * This service provides a convenient way to create GraphQL subscriptions that:
 * - Automatically track subscriber count via SubscriptionTrackerService
 * - Properly clean up resources when subscriptions end
 * - Handle errors gracefully
 *
 * **When to use this service:**
 * - In GraphQL resolvers when implementing subscriptions
 * - When you need automatic reference counting for shared resources
 * - When you want to ensure proper cleanup on subscription termination
 *
 * @example
 * // In a GraphQL resolver
 * \@Subscription(() => MetricsUpdate)
 * async metricsSubscription() {
 *   // Topic must be registered first via SubscriptionTrackerService
 *   return this.subscriptionHelper.createTrackedSubscription(GRAPHQL_PUBSUB_CHANNEL.METRICS);
 * }
 */
@Injectable()
export class SubscriptionHelperService {
    constructor(private readonly subscriptionTracker: SubscriptionTrackerService) {}

    /**
     * Creates a tracked async iterator that automatically handles subscription/unsubscription
     * @param topic The subscription topic/channel to subscribe to
     * @returns A proxy async iterator with automatic cleanup
     */
    public createTrackedSubscription<T = any>(
        topic: GRAPHQL_PUBSUB_CHANNEL | string
    ): AsyncIterableIterator<T> {
        const innerIterator = createSubscription<T>(topic);

        // Subscribe when the subscription starts
        this.subscriptionTracker.subscribe(topic);

        // Return a proxy async iterator that properly handles cleanup
        const proxyIterator: AsyncIterableIterator<T> = {
            next: () => innerIterator.next(),

            return: async () => {
                // Cleanup: unsubscribe from tracker
                this.subscriptionTracker.unsubscribe(topic);

                // Forward the return call to inner iterator
                if (innerIterator.return) {
                    return innerIterator.return();
                }
                return Promise.resolve({ value: undefined, done: true });
            },

            throw: async (error?: any) => {
                // Cleanup: unsubscribe from tracker on error
                this.subscriptionTracker.unsubscribe(topic);

                // Forward the throw call to inner iterator
                if (innerIterator.throw) {
                    return innerIterator.throw(error);
                }
                return Promise.reject(error);
            },

            // The proxy iterator returns itself for Symbol.asyncIterator
            [Symbol.asyncIterator]: () => proxyIterator,
        };

        return proxyIterator;
    }
}
