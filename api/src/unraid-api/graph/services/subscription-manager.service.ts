import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

/**
 * Configuration for managed subscriptions
 */
export interface SubscriptionConfig {
    /** Unique identifier for the subscription */
    name: string;

    /**
     * Polling interval in milliseconds.
     * - If set to a number, the callback will be called at that interval
     * - If null/undefined, the subscription is event-based (no polling)
     */
    intervalMs?: number | null;

    /** Function to call periodically (for polling) or once (for setup) */
    callback: () => Promise<void>;

    /** Optional function called when the subscription starts */
    onStart?: () => Promise<void>;

    /** Optional function called when the subscription stops */
    onStop?: () => Promise<void>;
}

/**
 * Low-level service for managing both polling and event-based subscriptions.
 *
 * ⚠️ **IMPORTANT**: This is an internal service. Do not use directly in resolvers or business logic.
 * Instead, use one of the higher-level services:
 * - **SubscriptionTrackerService**: For subscriptions that need reference counting
 * - **SubscriptionHelperService**: For GraphQL subscriptions with automatic cleanup
 *
 * This service provides the underlying implementation for:
 * - **Polling subscriptions**: Execute a callback at regular intervals
 * - **Event-based subscriptions**: Set up event listeners or watchers that persist until stopped
 *
 * @internal
 */
@Injectable()
export class SubscriptionManagerService implements OnModuleDestroy {
    private readonly logger = new Logger(SubscriptionManagerService.name);
    private readonly activeSubscriptions = new Map<
        string,
        { isPolling: boolean; config?: SubscriptionConfig }
    >();

    constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

    async onModuleDestroy() {
        await this.stopAll();
    }

    /**
     * Start a managed subscription (polling or event-based).
     *
     * @param config - The subscription configuration
     * @throws Will throw an error if the onStart callback fails
     */
    async startSubscription(config: SubscriptionConfig): Promise<void> {
        const { name, intervalMs, callback, onStart } = config;

        // Clean up any existing subscription with the same name
        await this.stopSubscription(name);

        // Initialize subscription state with config
        this.activeSubscriptions.set(name, { isPolling: false, config });

        // Call onStart callback if provided
        if (onStart) {
            try {
                await onStart();
                this.logger.debug(`Called onStart for '${name}'`);
            } catch (error) {
                this.logger.error(`Error in onStart for '${name}'`, error);
                throw error;
            }
        }

        // If intervalMs is null, this is a continuous/event-based subscription
        if (intervalMs === null || intervalMs === undefined) {
            this.logger.debug(`Started continuous subscription for '${name}' (no polling)`);
            return;
        }

        // Create the polling function with guard against overlapping executions
        const pollFunction = async () => {
            const subscription = this.activeSubscriptions.get(name);
            if (!subscription || subscription.isPolling) {
                return;
            }

            subscription.isPolling = true;
            try {
                await callback();
            } catch (error) {
                this.logger.error(`Error in subscription callback '${name}'`, error);
            } finally {
                if (subscription) {
                    subscription.isPolling = false;
                }
            }
        };

        // Create and register the interval
        const interval = setInterval(pollFunction, intervalMs);
        this.schedulerRegistry.addInterval(name, interval);

        this.logger.debug(`Started polling for '${name}' every ${intervalMs}ms`);
    }

    /**
     * Stop a managed subscription.
     *
     * This will:
     * 1. Stop any active polling interval
     * 2. Call the onStop callback if provided
     * 3. Clean up internal state
     *
     * @param name - The unique identifier of the subscription to stop
     */
    async stopSubscription(name: string): Promise<void> {
        // Get the config before deleting
        const subscription = this.activeSubscriptions.get(name);
        const onStop = subscription?.config?.onStop;

        try {
            if (this.schedulerRegistry.doesExist('interval', name)) {
                this.schedulerRegistry.deleteInterval(name);
                this.logger.debug(`Stopped polling interval for '${name}'`);
            }
        } catch (error) {
            // Interval doesn't exist, which is fine
        }

        // Call onStop callback if provided
        if (onStop) {
            try {
                await onStop();
                this.logger.debug(`Called onStop for '${name}'`);
            } catch (error) {
                this.logger.error(`Error in onStop for '${name}'`, error);
            }
        }

        // Clean up subscription state
        this.activeSubscriptions.delete(name);
    }

    /**
     * Stop all active subscriptions.
     *
     * This is automatically called when the module is destroyed.
     */
    async stopAll(): Promise<void> {
        // Get all active subscription keys (both polling and event-based)
        const activeKeys = Array.from(this.activeSubscriptions.keys());

        // Stop each subscription and await cleanup
        await Promise.all(activeKeys.map((key) => this.stopSubscription(key)));

        // Clear the map after all subscriptions are stopped
        this.activeSubscriptions.clear();
    }

    /**
     * Check if a subscription is active.
     *
     * @param name - The unique identifier of the subscription
     * @returns true if the subscription exists (either polling or event-based)
     */
    isSubscriptionActive(name: string): boolean {
        // Check both for polling intervals and event-based subscriptions
        return this.activeSubscriptions.has(name) || this.schedulerRegistry.doesExist('interval', name);
    }

    /**
     * Get the total number of active subscriptions.
     *
     * @returns The count of all active subscriptions (polling and event-based)
     */
    getActiveSubscriptionCount(): number {
        return this.activeSubscriptions.size;
    }

    /**
     * Get a list of all active subscription names.
     *
     * @returns Array of subscription identifiers
     */
    getActiveSubscriptionNames(): string[] {
        return Array.from(this.activeSubscriptions.keys());
    }
}
