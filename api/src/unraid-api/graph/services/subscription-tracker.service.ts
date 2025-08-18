import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionTrackerService {
    private subscriberCounts = new Map<string, number>();
    private topicHandlers = new Map<
        string,
        { onStart: () => void; onStop: () => void }
    >();

    public registerTopic(
        topic: string,
        onStart: () => void,
        onStop: () => void
    ): void {
        this.topicHandlers.set(topic, { onStart, onStop });
    }

    public subscribe(topic: string): void {
        const currentCount = this.subscriberCounts.get(topic) || 0;
        this.subscriberCounts.set(topic, currentCount + 1);

        if (currentCount === 0) {
            const handlers = this.topicHandlers.get(topic);
            if (handlers) {
                handlers.onStart();
            }
        }
    }

    public unsubscribe(topic: string): void {
        const currentCount = this.subscriberCounts.get(topic) || 1;
        const newCount = currentCount - 1;

        this.subscriberCounts.set(topic, newCount);

        if (newCount === 0) {
            const handlers = this.topicHandlers.get(topic);
            if (handlers) {
                handlers.onStop();
            }
        }
    }
}
