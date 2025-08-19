import { Injectable } from '@nestjs/common';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

/**
 * Helper service for creating tracked GraphQL subscriptions with automatic cleanup
 */
@Injectable()
export class SubscriptionHelperService {
    constructor(private readonly subscriptionTracker: SubscriptionTrackerService) {}

    /**
     * Creates a tracked async iterator that automatically handles subscription/unsubscription
     * @param topic The subscription topic/channel to subscribe to
     * @returns A proxy async iterator with automatic cleanup
     */
    public createTrackedSubscription<T = any>(topic: PUBSUB_CHANNEL): AsyncIterableIterator<T> {
        const iterator = createSubscription(topic) as AsyncIterable<T>;
        const innerIterator = iterator[Symbol.asyncIterator]();

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
