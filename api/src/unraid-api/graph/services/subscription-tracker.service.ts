import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SubscriptionTrackerService {
    private readonly logger = new Logger(SubscriptionTrackerService.name);
    private subscriberCounts = new Map<string, number>();
    private topicHandlers = new Map<string, { onStart: () => void; onStop: () => void }>();

    public registerTopic(topic: string, onStart: () => void, onStop: () => void): void {
        this.topicHandlers.set(topic, { onStart, onStop });
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
