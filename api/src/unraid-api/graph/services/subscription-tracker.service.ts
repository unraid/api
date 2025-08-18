import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionTrackerService {
    private subscriberCounts = new Map<string, number>();
    private topicHandlers = new Map<string, { onStart: () => void; onStop: () => void }>();

    public registerTopic(topic: string, onStart: () => void, onStop: () => void): void {
        this.topicHandlers.set(topic, { onStart, onStop });
    }

    public subscribe(topic: string): void {
        const currentCount = this.subscriberCounts.get(topic) ?? 0;
        this.subscriberCounts.set(topic, currentCount + 1);

        if (currentCount === 0) {
            const handlers = this.topicHandlers.get(topic);
            if (handlers?.onStart) {
                handlers.onStart();
            }
        }
    }

    public unsubscribe(topic: string): void {
        const currentCount = this.subscriberCounts.get(topic) ?? 0;

        // Early return for idempotency - if already at 0, do nothing
        if (currentCount === 0) {
            return;
        }

        const newCount = currentCount - 1;

        if (newCount === 0) {
            // Delete the topic entry when reaching zero
            this.subscriberCounts.delete(topic);

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
