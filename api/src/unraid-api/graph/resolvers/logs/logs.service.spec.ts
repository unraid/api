import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'node:fs/promises';

import * as chokidar from 'chokidar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LogWatcherManager } from '@app/unraid-api/graph/resolvers/logs/log-watcher-manager.service.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

vi.mock('node:fs/promises');
vi.mock('chokidar');
vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: () => ({
            'unraid-log-base': '/var/log',
        }),
    },
}));
vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn(),
    },
    PUBSUB_CHANNEL: {},
}));

describe('LogsService', () => {
    let service: LogsService;
    let mockWatcher: any;
    let subscriptionTracker: any;

    beforeEach(async () => {
        // Create a mock watcher
        mockWatcher = {
            on: vi.fn(),
            close: vi.fn(),
        };

        // Mock chokidar.watch to return our mock watcher
        vi.mocked(chokidar.watch).mockReturnValue(mockWatcher as any);

        // Mock fs.stat to return a file size
        vi.mocked(fs.stat).mockResolvedValue({ size: 1000 } as any);

        subscriptionTracker = {
            getSubscriberCount: vi.fn().mockReturnValue(0),
            registerTopic: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogsService,
                LogWatcherManager,
                {
                    provide: SubscriptionTrackerService,
                    useValue: subscriptionTracker,
                },
            ],
        }).compile();

        service = module.get<LogsService>(LogsService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should handle race condition when stopping watcher during initialization', async () => {
        // Setup: Register the subscription which will trigger registerTopic
        service.registerLogFileSubscription('test.log');

        // Get the onStart callback that was registered
        const registerTopicCall = subscriptionTracker.registerTopic.mock.calls[0];
        const onStartCallback = registerTopicCall[1];
        const onStopCallback = registerTopicCall[2];

        // Create a promise to control when stat resolves
        let statResolve: any;
        const statPromise = new Promise((resolve) => {
            statResolve = resolve;
        });
        vi.mocked(fs.stat).mockReturnValue(statPromise as any);

        // Start the watcher (this will call startWatchingLogFile internally)
        onStartCallback();

        // At this point, the watcher should be marked as 'initializing'
        // Now call stop before the stat promise resolves
        onStopCallback();

        // Now resolve the stat promise to complete initialization
        statResolve({ size: 1000 });

        // Wait for any async operations to complete
        await new Promise((resolve) => setImmediate(resolve));

        // The watcher should have been closed due to the race condition check
        expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('should not leak watcher if stopped multiple times during initialization', async () => {
        // Setup: Register the subscription
        service.registerLogFileSubscription('test.log');

        const registerTopicCall = subscriptionTracker.registerTopic.mock.calls[0];
        const onStartCallback = registerTopicCall[1];
        const onStopCallback = registerTopicCall[2];

        // Create controlled stat promise
        let statResolve: any;
        const statPromise = new Promise((resolve) => {
            statResolve = resolve;
        });
        vi.mocked(fs.stat).mockReturnValue(statPromise as any);

        // Start the watcher
        onStartCallback();

        // Call stop multiple times during initialization
        onStopCallback();
        onStopCallback();
        onStopCallback();

        // Complete initialization
        statResolve({ size: 1000 });
        await new Promise((resolve) => setImmediate(resolve));

        // Should only close once
        expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });

    it('should properly handle normal start and stop without race condition', async () => {
        // Setup: Register the subscription
        service.registerLogFileSubscription('test.log');

        const registerTopicCall = subscriptionTracker.registerTopic.mock.calls[0];
        const onStartCallback = registerTopicCall[1];
        const onStopCallback = registerTopicCall[2];

        // Make stat resolve immediately
        vi.mocked(fs.stat).mockResolvedValue({ size: 1000 } as any);

        // Start the watcher and let it complete initialization
        onStartCallback();
        await new Promise((resolve) => setImmediate(resolve));

        // Watcher should be created but not closed
        expect(chokidar.watch).toHaveBeenCalled();
        expect(mockWatcher.close).not.toHaveBeenCalled();

        // Now stop it normally
        onStopCallback();

        // Watcher should be closed
        expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });

    it('should handle error during initialization without leaking watchers', async () => {
        // Setup: Register the subscription
        service.registerLogFileSubscription('test.log');

        const registerTopicCall = subscriptionTracker.registerTopic.mock.calls[0];
        const onStartCallback = registerTopicCall[1];

        // Make stat reject with an error
        vi.mocked(fs.stat).mockRejectedValue(new Error('File not found'));

        // Start the watcher (should fail during initialization)
        onStartCallback();
        await new Promise((resolve) => setImmediate(resolve));

        // Watcher should never be created due to stat error
        expect(chokidar.watch).not.toHaveBeenCalled();
        expect(mockWatcher.close).not.toHaveBeenCalled();
    });

    it('should not create duplicate watchers when started multiple times', async () => {
        // Setup: Register the subscription
        service.registerLogFileSubscription('test.log');

        const registerTopicCall = subscriptionTracker.registerTopic.mock.calls[0];
        const onStartCallback = registerTopicCall[1];

        // Make stat resolve immediately
        vi.mocked(fs.stat).mockResolvedValue({ size: 1000 } as any);

        // Start the watcher multiple times
        onStartCallback();
        onStartCallback();
        onStartCallback();

        await new Promise((resolve) => setImmediate(resolve));

        // Should only create one watcher
        expect(chokidar.watch).toHaveBeenCalledTimes(1);
    });
});
