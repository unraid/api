import { Injectable, Logger } from '@nestjs/common';

import * as chokidar from 'chokidar';

export enum WatcherState {
    INITIALIZING = 'initializing',
    ACTIVE = 'active',
    STOPPING = 'stopping',
}

export type WatcherEntry =
    | { state: WatcherState.INITIALIZING }
    | { state: WatcherState.ACTIVE; watcher: chokidar.FSWatcher; position: number; inFlight: boolean }
    | { state: WatcherState.STOPPING };

/**
 * Service responsible for managing log file watchers and their lifecycle.
 * Handles race conditions during watcher initialization and cleanup.
 */
@Injectable()
export class LogWatcherManager {
    private readonly logger = new Logger(LogWatcherManager.name);
    private readonly watchers = new Map<string, WatcherEntry>();

    /**
     * Set a watcher as initializing
     */
    setInitializing(key: string): void {
        this.watchers.set(key, { state: WatcherState.INITIALIZING });
    }

    /**
     * Set a watcher as active with its FSWatcher and position
     */
    setActive(key: string, watcher: chokidar.FSWatcher, position: number): void {
        this.watchers.set(key, { state: WatcherState.ACTIVE, watcher, position, inFlight: false });
    }

    /**
     * Mark a watcher as stopping (used during initialization race conditions)
     */
    setStopping(key: string): void {
        this.watchers.set(key, { state: WatcherState.STOPPING });
    }

    /**
     * Get a watcher entry by key
     */
    getEntry(key: string): WatcherEntry | undefined {
        return this.watchers.get(key);
    }

    /**
     * Remove a watcher entry
     */
    removeEntry(key: string): void {
        this.watchers.delete(key);
    }

    /**
     * Check if a watcher is active and return typed entry
     */
    isActive(entry: WatcherEntry | undefined): entry is {
        state: WatcherState.ACTIVE;
        watcher: chokidar.FSWatcher;
        position: number;
        inFlight: boolean;
    } {
        return entry?.state === WatcherState.ACTIVE;
    }

    /**
     * Check if a watcher exists and is either initializing or active
     */
    isWatchingOrInitializing(key: string): boolean {
        const entry = this.getEntry(key);
        return (
            entry !== undefined &&
            (entry.state === WatcherState.ACTIVE || entry.state === WatcherState.INITIALIZING)
        );
    }

    /**
     * Handle cleanup after initialization completes.
     * Returns true if the watcher should continue, false if it should be cleaned up.
     */
    handlePostInitialization(key: string, watcher: chokidar.FSWatcher, position: number): boolean {
        const currentEntry = this.getEntry(key);

        if (!currentEntry || currentEntry.state === WatcherState.STOPPING) {
            // We were stopped during initialization, clean up immediately
            this.logger.debug(`Watcher for ${key} was stopped during initialization, cleaning up`);
            watcher.close();
            this.removeEntry(key);
            return false;
        }

        // Store the active watcher and position
        this.setActive(key, watcher, position);
        return true;
    }

    /**
     * Stop a watcher, handling all possible states
     */
    stopWatcher(key: string): void {
        const entry = this.getEntry(key);

        if (!entry) {
            return;
        }

        if (entry.state === WatcherState.INITIALIZING) {
            // Mark as stopping so the initialization will clean up
            this.setStopping(key);
            this.logger.debug(`Marked watcher as stopping during initialization: ${key}`);
        } else if (entry.state === WatcherState.ACTIVE) {
            // Close the active watcher
            entry.watcher.close();
            this.removeEntry(key);
            this.logger.debug(`Stopped active watcher: ${key}`);
        }
    }

    /**
     * Update the position for an active watcher
     */
    updatePosition(key: string, newPosition: number): void {
        const entry = this.getEntry(key);
        if (this.isActive(entry)) {
            entry.position = newPosition;
        }
    }

    /**
     * Start processing a change event (set inFlight to true)
     * Returns true if processing can proceed, false if already in flight
     */
    startProcessing(key: string): boolean {
        const entry = this.getEntry(key);
        if (this.isActive(entry)) {
            if (entry.inFlight) {
                return false; // Already processing
            }
            entry.inFlight = true;
            return true;
        }
        return false;
    }

    /**
     * Finish processing a change event (set inFlight to false)
     */
    finishProcessing(key: string): void {
        const entry = this.getEntry(key);
        if (this.isActive(entry)) {
            entry.inFlight = false;
        }
    }

    /**
     * Get the position for an active watcher
     */
    getPosition(key: string): number | undefined {
        const entry = this.getEntry(key);
        if (this.isActive(entry)) {
            return entry.position;
        }
        return undefined;
    }

    /**
     * Clean up all watchers (useful for module cleanup)
     */
    stopAllWatchers(): void {
        for (const entry of this.watchers.values()) {
            if (this.isActive(entry)) {
                entry.watcher.close();
            }
        }
        this.watchers.clear();
    }
}
