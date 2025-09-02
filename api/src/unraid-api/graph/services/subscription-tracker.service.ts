import { Injectable, Logger } from '@nestjs/common';

import { SubscriptionManagerService } from '@app/unraid-api/graph/services/subscription-manager.service.js';

/**
 * Service for managing subscriptions with automatic reference counting.
 *
 * This service tracks the number of active subscribers for each topic and automatically
 * starts/stops the underlying subscription based on subscriber count.
 *
 * **When to use this service:**
 * - When you have multiple GraphQL subscriptions that share the same data source
 * - When you need to start a resource (polling, file watcher, etc.) only when there are active subscribers
 * - When you need automatic cleanup when the last subscriber disconnects
 *
 * @example
 * // Register a polling subscription
 * subscriptionTracker.registerTopic(
 *   'metrics-update',
 *   async () => {
 *     const metrics = await fetchMetrics();
 *     pubsub.publish('metrics-update', { metrics });
 *   },
 *   5000 // Poll every 5 seconds
 * );
 *
 * @example
 * // Register an event-based subscription (e.g., file watching)
 * subscriptionTracker.registerTopic(
 *   'log-file-updates',
 *   () => startFileWatcher('/var/log/app.log'), // onStart
 *   () => stopFileWatcher('/var/log/app.log')   // onStop
 * );
 */
@Injectable()
export class SubscriptionTrackerService {
    private readonly logger = new Logger(SubscriptionTrackerService.name);
    private subscriberCounts = new Map<string, number>();
    private topicHandlers = new Map<string, { onStart: () => void; onStop: () => void }>();

    constructor(private readonly subscriptionManager: SubscriptionManagerService) {}

    /**
     * Register a topic with optional polling support
     * @param topic The topic identifier
     * @param callbackOrOnStart The callback function to execute (can be async) OR onStart handler for legacy support
     * @param intervalMsOrOnStop Optional interval in ms for polling OR onStop handler for legacy support
     */
    public registerTopic(
        topic: string,
        callbackOrOnStart: () => void | Promise<void>,
        intervalMsOrOnStop?: number | (() => void)
    ): void {
        if (typeof intervalMsOrOnStop === 'number') {
            // New API: callback with polling interval
            const pollingConfig = {
                name: topic,
                intervalMs: intervalMsOrOnStop,
                callback: async () => callbackOrOnStart(),
            };
            this.topicHandlers.set(topic, {
                onStart: () => this.subscriptionManager.startSubscription(pollingConfig),
                onStop: () => this.subscriptionManager.stopSubscription(topic),
            });
        } else {
            // Legacy API: onStart and onStop handlers
            this.topicHandlers.set(topic, {
                onStart: callbackOrOnStart,
                onStop: intervalMsOrOnStop || (() => {}),
            });
        }
    }

    public subscribe(topic: string): void {
        const currentCount = this.subscriberCounts.get(topic) ?? 0;
        const newCount = currentCount + 1;
        this.subscriberCounts.set(topic, newCount);

        this.logger.debug(`Subscription added for topic '${topic}': ${newCount} active subscriber(s)`);

        if (currentCount === 0) {
            this.logger.debug(`Starting topic '${topic}' (first subscriber)`);
            const handlers = this.topicHandlers.get(topic);
            if (handlers?.onStart) {
                handlers.onStart();
            }
        }
    }

    /**
     * Get the current subscriber count for a topic
     * @param topic The topic to check
     * @returns The number of active subscribers
     */
    public getSubscriberCount(topic: string): number {
        return this.subscriberCounts.get(topic) ?? 0;
    }

    /**
     * Get all active topics and their subscriber counts
     * @returns A map of topics to subscriber counts
     */
    public getAllSubscriberCounts(): Map<string, number> {
        return new Map(this.subscriberCounts);
    }

    public unsubscribe(topic: string): void {
        const currentCount = this.subscriberCounts.get(topic) ?? 0;

        // Early return for idempotency - if already at 0, do nothing
        if (currentCount === 0) {
            this.logger.debug(
                `Unsubscribe called for topic '${topic}' but no active subscribers (idempotent)`
            );
            return;
        }

        const newCount = currentCount - 1;

        this.logger.debug(
            `Subscription removed for topic '${topic}': ${newCount} active subscriber(s) remaining`
        );

        if (newCount === 0) {
            // Delete the topic entry when reaching zero
            this.subscriberCounts.delete(topic);

            this.logger.debug(`Stopping topic '${topic}' (last subscriber removed)`);

            // Call onStop handler if it exists
            const handlers = this.topicHandlers.get(topic);
            if (handlers?.onStop) {
                handlers.onStop();
            }
        } else {
            // Only update the count if not zero
            this.subscriberCounts.set(topic, newCount);
        }
    }
}
