import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

export interface PollingConfig {
    name: string;
    intervalMs: number;
    callback: () => Promise<void>;
}

@Injectable()
export class SubscriptionPollingService implements OnModuleDestroy {
    private readonly logger = new Logger(SubscriptionPollingService.name);
    private readonly activePollers = new Map<string, { isPolling: boolean }>();

    constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

    onModuleDestroy() {
        this.stopAll();
    }

    /**
     * Start polling for a specific subscription topic
     */
    startPolling(config: PollingConfig): void {
        const { name, intervalMs, callback } = config;

        // Clean up any existing interval
        this.stopPolling(name);

        // Initialize polling state
        this.activePollers.set(name, { isPolling: false });

        // Create the polling function with guard against overlapping executions
        const pollFunction = async () => {
            const poller = this.activePollers.get(name);
            if (!poller || poller.isPolling) {
                return;
            }

            poller.isPolling = true;
            try {
                await callback();
            } catch (error) {
                this.logger.error(`Error in polling task '${name}'`, error);
            } finally {
                if (poller) {
                    poller.isPolling = false;
                }
            }
        };

        // Create and register the interval
        const interval = setInterval(pollFunction, intervalMs);
        this.schedulerRegistry.addInterval(name, interval);

        this.logger.debug(`Started polling for '${name}' every ${intervalMs}ms`);
    }

    /**
     * Stop polling for a specific subscription topic
     */
    stopPolling(name: string): void {
        try {
            if (this.schedulerRegistry.doesExist('interval', name)) {
                this.schedulerRegistry.deleteInterval(name);
                this.logger.debug(`Stopped polling for '${name}'`);
            }
        } catch (error) {
            // Interval doesn't exist, which is fine
        }

        // Clean up polling state
        this.activePollers.delete(name);
    }

    /**
     * Stop all active polling tasks
     */
    stopAll(): void {
        const intervals = this.schedulerRegistry.getIntervals();
        intervals.forEach((key) => this.stopPolling(key));
        this.activePollers.clear();
    }

    /**
     * Check if polling is active for a given name
     */
    isPolling(name: string): boolean {
        return this.schedulerRegistry.doesExist('interval', name);
    }
}
