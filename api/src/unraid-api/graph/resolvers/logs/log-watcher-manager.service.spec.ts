import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    LogWatcherManager,
    WatcherState,
} from '@app/unraid-api/graph/resolvers/logs/log-watcher-manager.service.js';

describe('LogWatcherManager', () => {
    let manager: LogWatcherManager;
    let mockWatcher: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LogWatcherManager],
        }).compile();

        manager = module.get<LogWatcherManager>(LogWatcherManager);

        mockWatcher = {
            close: vi.fn(),
            on: vi.fn(),
        };
    });

    describe('state management', () => {
        it('should set watcher as initializing', () => {
            manager.setInitializing('test-key');
            const entry = manager.getEntry('test-key');
            expect(entry).toBeDefined();
            expect(entry?.state).toBe(WatcherState.INITIALIZING);
        });

        it('should set watcher as active with position', () => {
            manager.setActive('test-key', mockWatcher as any, 1000);
            const entry = manager.getEntry('test-key');
            expect(entry).toBeDefined();
            expect(entry?.state).toBe(WatcherState.ACTIVE);
            if (manager.isActive(entry)) {
                expect(entry.watcher).toBe(mockWatcher);
                expect(entry.position).toBe(1000);
            }
        });

        it('should set watcher as stopping', () => {
            manager.setStopping('test-key');
            const entry = manager.getEntry('test-key');
            expect(entry).toBeDefined();
            expect(entry?.state).toBe(WatcherState.STOPPING);
        });
    });

    describe('isWatchingOrInitializing', () => {
        it('should return true for initializing watcher', () => {
            manager.setInitializing('test-key');
            expect(manager.isWatchingOrInitializing('test-key')).toBe(true);
        });

        it('should return true for active watcher', () => {
            manager.setActive('test-key', mockWatcher as any, 0);
            expect(manager.isWatchingOrInitializing('test-key')).toBe(true);
        });

        it('should return false for stopping watcher', () => {
            manager.setStopping('test-key');
            expect(manager.isWatchingOrInitializing('test-key')).toBe(false);
        });

        it('should return false for non-existent watcher', () => {
            expect(manager.isWatchingOrInitializing('test-key')).toBe(false);
        });
    });

    describe('handlePostInitialization', () => {
        it('should activate watcher when not stopped', () => {
            manager.setInitializing('test-key');
            const result = manager.handlePostInitialization('test-key', mockWatcher as any, 500);

            expect(result).toBe(true);
            expect(mockWatcher.close).not.toHaveBeenCalled();

            const entry = manager.getEntry('test-key');
            expect(entry?.state).toBe(WatcherState.ACTIVE);
            if (manager.isActive(entry)) {
                expect(entry.position).toBe(500);
            }
        });

        it('should cleanup watcher when marked as stopping', () => {
            manager.setStopping('test-key');
            const result = manager.handlePostInitialization('test-key', mockWatcher as any, 500);

            expect(result).toBe(false);
            expect(mockWatcher.close).toHaveBeenCalled();
            expect(manager.getEntry('test-key')).toBeUndefined();
        });

        it('should cleanup watcher when entry is missing', () => {
            const result = manager.handlePostInitialization('test-key', mockWatcher as any, 500);

            expect(result).toBe(false);
            expect(mockWatcher.close).toHaveBeenCalled();
            expect(manager.getEntry('test-key')).toBeUndefined();
        });
    });

    describe('stopWatcher', () => {
        it('should mark initializing watcher as stopping', () => {
            manager.setInitializing('test-key');
            manager.stopWatcher('test-key');

            const entry = manager.getEntry('test-key');
            expect(entry?.state).toBe(WatcherState.STOPPING);
        });

        it('should close and remove active watcher', () => {
            manager.setActive('test-key', mockWatcher as any, 0);
            manager.stopWatcher('test-key');

            expect(mockWatcher.close).toHaveBeenCalled();
            expect(manager.getEntry('test-key')).toBeUndefined();
        });

        it('should do nothing for non-existent watcher', () => {
            manager.stopWatcher('test-key');
            expect(mockWatcher.close).not.toHaveBeenCalled();
        });
    });

    describe('position management', () => {
        it('should update position for active watcher', () => {
            manager.setActive('test-key', mockWatcher as any, 100);
            manager.updatePosition('test-key', 200);

            const position = manager.getPosition('test-key');
            expect(position).toBe(200);
        });

        it('should not update position for non-active watcher', () => {
            manager.setInitializing('test-key');
            manager.updatePosition('test-key', 200);

            const position = manager.getPosition('test-key');
            expect(position).toBeUndefined();
        });

        it('should get position for active watcher', () => {
            manager.setActive('test-key', mockWatcher as any, 300);
            expect(manager.getPosition('test-key')).toBe(300);
        });

        it('should return undefined for non-active watcher', () => {
            manager.setStopping('test-key');
            expect(manager.getPosition('test-key')).toBeUndefined();
        });
    });

    describe('stopAllWatchers', () => {
        it('should close all active watchers and clear map', () => {
            const mockWatcher1 = { close: vi.fn() };
            const mockWatcher2 = { close: vi.fn() };
            const mockWatcher3 = { close: vi.fn() };

            manager.setActive('key1', mockWatcher1 as any, 0);
            manager.setInitializing('key2');
            manager.setActive('key3', mockWatcher2 as any, 0);
            manager.setStopping('key4');
            manager.setActive('key5', mockWatcher3 as any, 0);

            manager.stopAllWatchers();

            expect(mockWatcher1.close).toHaveBeenCalled();
            expect(mockWatcher2.close).toHaveBeenCalled();
            expect(mockWatcher3.close).toHaveBeenCalled();

            expect(manager.getEntry('key1')).toBeUndefined();
            expect(manager.getEntry('key2')).toBeUndefined();
            expect(manager.getEntry('key3')).toBeUndefined();
            expect(manager.getEntry('key4')).toBeUndefined();
            expect(manager.getEntry('key5')).toBeUndefined();
        });
    });

    describe('in-flight processing', () => {
        it('should prevent concurrent processing', () => {
            manager.setActive('test-key', mockWatcher as any, 0);

            // First call should succeed
            expect(manager.startProcessing('test-key')).toBe(true);

            // Second call should fail (already in flight)
            expect(manager.startProcessing('test-key')).toBe(false);

            // After finishing, should be able to start again
            manager.finishProcessing('test-key');
            expect(manager.startProcessing('test-key')).toBe(true);
        });

        it('should not start processing for non-active watcher', () => {
            manager.setInitializing('test-key');
            expect(manager.startProcessing('test-key')).toBe(false);

            manager.setStopping('test-key');
            expect(manager.startProcessing('test-key')).toBe(false);
        });

        it('should handle finish processing for non-existent watcher', () => {
            // Should not throw
            expect(() => manager.finishProcessing('non-existent')).not.toThrow();
        });
    });
});
