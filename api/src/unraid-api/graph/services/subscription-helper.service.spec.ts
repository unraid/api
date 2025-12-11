import { Logger } from '@nestjs/common';

import { GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';
import { PubSub } from 'graphql-subscriptions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub } from '@app/core/pubsub.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('SubscriptionHelperService', () => {
    let helperService: SubscriptionHelperService;
    let trackerService: SubscriptionTrackerService;
    let loggerSpy: any;

    beforeEach(() => {
        const mockPollingService = {
            startPolling: vi.fn(),
            stopPolling: vi.fn(),
        };
        trackerService = new SubscriptionTrackerService(mockPollingService as any);
        helperService = new SubscriptionHelperService(trackerService);
        loggerSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('createTrackedSubscription', () => {
        it('should create an async iterator that tracks subscriptions', async () => {
            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            expect(iterator).toBeDefined();
            expect(iterator.next).toBeDefined();
            expect(iterator.return).toBeDefined();
            expect(iterator.throw).toBeDefined();
            expect(iterator[Symbol.asyncIterator]).toBeDefined();

            // Should have subscribed
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);
        });

        it('should return itself when Symbol.asyncIterator is called', () => {
            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            expect(iterator[Symbol.asyncIterator]()).toBe(iterator);
        });

        it('should unsubscribe when return() is called', async () => {
            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);

            await iterator.return?.();

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);
        });

        it('should unsubscribe when throw() is called', async () => {
            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);

            try {
                await iterator.throw?.(new Error('Test error'));
            } catch (e) {
                // Expected to throw
            }

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);
        });
    });

    describe('integration with pubsub', () => {
        it('should receive published messages', async () => {
            const iterator = helperService.createTrackedSubscription<{ cpuUtilization: any }>(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            const testData = {
                cpuUtilization: {
                    id: 'test',
                    load: 50,
                    cpus: [],
                },
            };

            // Set up the consumption promise first
            const consumePromise = iterator.next();

            // Give a small delay to ensure subscription is fully set up
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Publish a message
            await (pubsub as PubSub).publish(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION, testData);

            // Wait for the message
            const result = await consumePromise;

            expect(result.done).toBe(false);
            expect(result.value).toEqual(testData);

            await iterator.return?.();
        });

        it('should handle multiple subscribers independently', async () => {
            // Register handlers to verify start/stop behavior
            const onStart = vi.fn();
            const onStop = vi.fn();
            trackerService.registerTopic(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION, onStart, onStop);

            // Create first subscriber
            const iterator1 = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);
            expect(onStart).toHaveBeenCalledTimes(1);

            // Create second subscriber
            const iterator2 = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(2);
            expect(onStart).toHaveBeenCalledTimes(1); // Should not call again

            // Create third subscriber
            const iterator3 = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(3);

            // Set up consumption promises first
            const consume1 = iterator1.next();
            const consume2 = iterator2.next();
            const consume3 = iterator3.next();

            // Give a small delay to ensure subscriptions are fully set up
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Publish a message - all should receive it
            const testData = { cpuUtilization: { id: 'test', load: 75, cpus: [] } };
            await (pubsub as PubSub).publish(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION, testData);

            const [result1, result2, result3] = await Promise.all([consume1, consume2, consume3]);

            expect(result1.value).toEqual(testData);
            expect(result2.value).toEqual(testData);
            expect(result3.value).toEqual(testData);

            // Clean up first subscriber
            await iterator1.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(2);
            expect(onStop).not.toHaveBeenCalled();

            // Clean up second subscriber
            await iterator2.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);
            expect(onStop).not.toHaveBeenCalled();

            // Clean up last subscriber - should trigger onStop
            await iterator3.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);
            expect(onStop).toHaveBeenCalledTimes(1);
        });

        it('should handle rapid subscribe/unsubscribe cycles', async () => {
            const iterations = 10;

            for (let i = 0; i < iterations; i++) {
                const iterator = helperService.createTrackedSubscription(
                    GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
                );
                expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(
                    1
                );

                await iterator.return?.();
                expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(
                    0
                );
            }
        });

        it('should properly clean up on error', async () => {
            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);

            const testError = new Error('Test error');

            try {
                await iterator.throw?.(testError);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBe(testError);
            }

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);
        });

        it('should log debug messages for subscription lifecycle', async () => {
            vi.clearAllMocks();

            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.stringContaining('Subscription added for topic')
            );

            await iterator.return?.();

            expect(loggerSpy).toHaveBeenCalledWith(
                expect.stringContaining('Subscription removed for topic')
            );
        });
    });

    describe('different topic types', () => {
        it('should handle INFO channel subscriptions', async () => {
            const iterator = helperService.createTrackedSubscription(GRAPHQL_PUBSUB_CHANNEL.INFO);

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.INFO)).toBe(1);

            // Set up consumption promise first
            const consumePromise = iterator.next();

            // Give a small delay to ensure subscription is fully set up
            await new Promise((resolve) => setTimeout(resolve, 10));

            const testData = { info: { id: 'test-info' } };
            await (pubsub as PubSub).publish(GRAPHQL_PUBSUB_CHANNEL.INFO, testData);

            const result = await consumePromise;
            expect(result.value).toEqual(testData);

            await iterator.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.INFO)).toBe(0);
        });

        it('should track multiple different topics independently', async () => {
            const cpuIterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );
            const infoIterator = helperService.createTrackedSubscription(GRAPHQL_PUBSUB_CHANNEL.INFO);

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.INFO)).toBe(1);

            const allCounts = trackerService.getAllSubscriberCounts();
            expect(allCounts.get(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);
            expect(allCounts.get(GRAPHQL_PUBSUB_CHANNEL.INFO)).toBe(1);

            await cpuIterator.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.INFO)).toBe(1);

            await infoIterator.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.INFO)).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle return() called multiple times', async () => {
            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(1);

            await iterator.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);

            // Second return should be idempotent
            await iterator.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);

            // Check that idempotent message was logged
            expect(loggerSpy).toHaveBeenCalledWith(
                expect.stringContaining('no active subscribers (idempotent)')
            );
        });

        it('should handle async iterator protocol correctly', async () => {
            const iterator = helperService.createTrackedSubscription(
                GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION
            );

            // Test that it works in for-await loop (would use Symbol.asyncIterator)
            const receivedMessages: any[] = [];
            const maxMessages = 3;

            // Start consuming in background
            const consumePromise = (async () => {
                let count = 0;
                for await (const message of iterator) {
                    receivedMessages.push(message);
                    count++;
                    if (count >= maxMessages) {
                        break;
                    }
                }
            })();

            // Publish messages
            for (let i = 0; i < maxMessages; i++) {
                await (pubsub as PubSub).publish(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION, {
                    cpuUtilization: { id: `test-${i}`, load: i * 10, cpus: [] },
                });
            }

            // Wait for consumption to complete
            await consumePromise;

            expect(receivedMessages).toHaveLength(maxMessages);
            expect(receivedMessages[0].cpuUtilization.load).toBe(0);
            expect(receivedMessages[1].cpuUtilization.load).toBe(10);
            expect(receivedMessages[2].cpuUtilization.load).toBe(20);

            // Clean up
            await iterator.return?.();
            expect(trackerService.getSubscriberCount(GRAPHQL_PUBSUB_CHANNEL.CPU_UTILIZATION)).toBe(0);
        });
    });
});
