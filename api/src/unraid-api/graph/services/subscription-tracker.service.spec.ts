import { Logger } from '@nestjs/common';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('SubscriptionTrackerService', () => {
    let service: SubscriptionTrackerService;
    let loggerSpy: any;

    beforeEach(() => {
        service = new SubscriptionTrackerService();
        // Spy on logger methods
        loggerSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('registerTopic', () => {
        it('should register topic handlers', () => {
            const onStart = vi.fn();
            const onStop = vi.fn();

            service.registerTopic('TEST_TOPIC', onStart, onStop);

            // Verify handlers are stored (indirectly through subscribe/unsubscribe)
            service.subscribe('TEST_TOPIC');
            expect(onStart).toHaveBeenCalledTimes(1);

            service.unsubscribe('TEST_TOPIC');
            expect(onStop).toHaveBeenCalledTimes(1);
        });
    });

    describe('subscribe', () => {
        it('should increment subscriber count', () => {
            service.subscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(1);

            service.subscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(2);

            service.subscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(3);
        });

        it('should call onStart handler only for first subscriber', () => {
            const onStart = vi.fn();
            const onStop = vi.fn();

            service.registerTopic('TEST_TOPIC', onStart, onStop);

            // First subscriber should trigger onStart
            service.subscribe('TEST_TOPIC');
            expect(onStart).toHaveBeenCalledTimes(1);

            // Additional subscribers should not trigger onStart
            service.subscribe('TEST_TOPIC');
            service.subscribe('TEST_TOPIC');
            expect(onStart).toHaveBeenCalledTimes(1);
        });

        it('should log subscription events', () => {
            service.subscribe('TEST_TOPIC');
            expect(loggerSpy).toHaveBeenCalledWith(
                "Subscription added for topic 'TEST_TOPIC': 1 active subscriber(s)"
            );

            service.subscribe('TEST_TOPIC');
            expect(loggerSpy).toHaveBeenCalledWith(
                "Subscription added for topic 'TEST_TOPIC': 2 active subscriber(s)"
            );
        });

        it('should log when starting a topic', () => {
            const onStart = vi.fn();
            const onStop = vi.fn();

            service.registerTopic('TEST_TOPIC', onStart, onStop);
            service.subscribe('TEST_TOPIC');

            expect(loggerSpy).toHaveBeenCalledWith("Starting topic 'TEST_TOPIC' (first subscriber)");
        });
    });

    describe('unsubscribe', () => {
        it('should decrement subscriber count', () => {
            service.subscribe('TEST_TOPIC');
            service.subscribe('TEST_TOPIC');
            service.subscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(3);

            service.unsubscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(2);

            service.unsubscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(1);

            service.unsubscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(0);
        });

        it('should call onStop handler only when last subscriber unsubscribes', () => {
            const onStart = vi.fn();
            const onStop = vi.fn();

            service.registerTopic('TEST_TOPIC', onStart, onStop);

            service.subscribe('TEST_TOPIC');
            service.subscribe('TEST_TOPIC');
            service.subscribe('TEST_TOPIC');

            service.unsubscribe('TEST_TOPIC');
            expect(onStop).not.toHaveBeenCalled();

            service.unsubscribe('TEST_TOPIC');
            expect(onStop).not.toHaveBeenCalled();

            service.unsubscribe('TEST_TOPIC');
            expect(onStop).toHaveBeenCalledTimes(1);
        });

        it('should be idempotent when called with no subscribers', () => {
            const onStart = vi.fn();
            const onStop = vi.fn();

            service.registerTopic('TEST_TOPIC', onStart, onStop);

            // Unsubscribe without any subscribers
            service.unsubscribe('TEST_TOPIC');
            expect(onStop).not.toHaveBeenCalled();
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(0);

            // Should log idempotent message
            expect(loggerSpy).toHaveBeenCalledWith(
                "Unsubscribe called for topic 'TEST_TOPIC' but no active subscribers (idempotent)"
            );
        });

        it('should log unsubscription events', () => {
            service.subscribe('TEST_TOPIC');
            service.subscribe('TEST_TOPIC');

            vi.clearAllMocks();

            service.unsubscribe('TEST_TOPIC');
            expect(loggerSpy).toHaveBeenCalledWith(
                "Subscription removed for topic 'TEST_TOPIC': 1 active subscriber(s) remaining"
            );

            service.unsubscribe('TEST_TOPIC');
            expect(loggerSpy).toHaveBeenCalledWith(
                "Subscription removed for topic 'TEST_TOPIC': 0 active subscriber(s) remaining"
            );
        });

        it('should log when stopping a topic', () => {
            const onStart = vi.fn();
            const onStop = vi.fn();

            service.registerTopic('TEST_TOPIC', onStart, onStop);
            service.subscribe('TEST_TOPIC');

            vi.clearAllMocks();

            service.unsubscribe('TEST_TOPIC');
            expect(loggerSpy).toHaveBeenCalledWith(
                "Stopping topic 'TEST_TOPIC' (last subscriber removed)"
            );
        });

        it('should delete topic entry when count reaches zero', () => {
            service.subscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(1);

            service.unsubscribe('TEST_TOPIC');
            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(0);

            // Should return 0 for non-existent topics
            expect(service.getAllSubscriberCounts().has('TEST_TOPIC')).toBe(false);
        });
    });

    describe('getSubscriberCount', () => {
        it('should return correct count for active topic', () => {
            service.subscribe('TEST_TOPIC');
            service.subscribe('TEST_TOPIC');

            expect(service.getSubscriberCount('TEST_TOPIC')).toBe(2);
        });

        it('should return 0 for non-existent topic', () => {
            expect(service.getSubscriberCount('UNKNOWN_TOPIC')).toBe(0);
        });
    });

    describe('getAllSubscriberCounts', () => {
        it('should return all active topics and counts', () => {
            service.subscribe('TOPIC_1');
            service.subscribe('TOPIC_1');
            service.subscribe('TOPIC_2');
            service.subscribe('TOPIC_3');
            service.subscribe('TOPIC_3');
            service.subscribe('TOPIC_3');

            const counts = service.getAllSubscriberCounts();

            expect(counts.get('TOPIC_1')).toBe(2);
            expect(counts.get('TOPIC_2')).toBe(1);
            expect(counts.get('TOPIC_3')).toBe(3);
        });

        it('should return empty map when no subscribers', () => {
            const counts = service.getAllSubscriberCounts();
            expect(counts.size).toBe(0);
        });

        it('should return a copy of the internal map', () => {
            service.subscribe('TEST_TOPIC');

            const counts1 = service.getAllSubscriberCounts();
            counts1.set('TEST_TOPIC', 999);

            const counts2 = service.getAllSubscriberCounts();
            expect(counts2.get('TEST_TOPIC')).toBe(1);
        });
    });

    describe('complex scenarios', () => {
        it('should handle multiple topics independently', () => {
            const onStart1 = vi.fn();
            const onStop1 = vi.fn();
            const onStart2 = vi.fn();
            const onStop2 = vi.fn();

            service.registerTopic('TOPIC_1', onStart1, onStop1);
            service.registerTopic('TOPIC_2', onStart2, onStop2);

            service.subscribe('TOPIC_1');
            expect(onStart1).toHaveBeenCalledTimes(1);
            expect(onStart2).not.toHaveBeenCalled();

            service.subscribe('TOPIC_2');
            expect(onStart2).toHaveBeenCalledTimes(1);

            service.unsubscribe('TOPIC_1');
            expect(onStop1).toHaveBeenCalledTimes(1);
            expect(onStop2).not.toHaveBeenCalled();

            service.unsubscribe('TOPIC_2');
            expect(onStop2).toHaveBeenCalledTimes(1);
        });

        it('should handle resubscription after all unsubscribed', () => {
            const onStart = vi.fn();
            const onStop = vi.fn();

            service.registerTopic('TEST_TOPIC', onStart, onStop);

            // First cycle
            service.subscribe('TEST_TOPIC');
            service.unsubscribe('TEST_TOPIC');

            expect(onStart).toHaveBeenCalledTimes(1);
            expect(onStop).toHaveBeenCalledTimes(1);

            // Second cycle - should call onStart again
            service.subscribe('TEST_TOPIC');
            expect(onStart).toHaveBeenCalledTimes(2);

            service.unsubscribe('TEST_TOPIC');
            expect(onStop).toHaveBeenCalledTimes(2);
        });

        it('should handle missing handlers gracefully', () => {
            // Subscribe without registering handlers
            expect(() => service.subscribe('UNREGISTERED_TOPIC')).not.toThrow();
            expect(() => service.unsubscribe('UNREGISTERED_TOPIC')).not.toThrow();

            expect(service.getSubscriberCount('UNREGISTERED_TOPIC')).toBe(0);
        });
    });
});
