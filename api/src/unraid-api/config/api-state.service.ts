import { Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import type { ApiStateConfig } from '@app/unraid-api/config/api-state.model.js';
import { makeConfigToken } from '@app/unraid-api/config/config.injection.js';

export interface ApiStateConfigPersistenceOptions {
    /** How often to persist the config to the file system, in milliseconds. Defaults to 10 seconds. */
    intervalMs?: number;
    /** How many consecutive failed persistence attempts to tolerate before stopping. Defaults to 5. */
    maxConsecutiveFailures?: number;
    /** By default, the config will be persisted to the file system when the module is initialized and destroyed.
     * Set this to true to disable this behavior.
     */
    disableLifecycleHooks?: boolean;
}

export class ScheduledConfigPersistence<T> {
    private consecutiveFailures = 0;
    private logger: Logger;

    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly config: ApiStateConfig<T>,
        private readonly options: ApiStateConfigPersistenceOptions
    ) {
        this.logger = new Logger(this.token);
    }

    get token() {
        return makeConfigToken(this.configName, ScheduledConfigPersistence.name);
    }

    get configName() {
        return this.config.options.name;
    }

    onModuleInit() {
        if (this.options.disableLifecycleHooks) return;
        this.setup();
    }

    async onModuleDestroy() {
        if (this.options.disableLifecycleHooks) return;
        this.stop();
        await this.config.persist();
    }

    stop() {
        if (this.schedulerRegistry.getInterval(this.token)) {
            this.schedulerRegistry.deleteInterval(this.token);
        }
    }

    setup() {
        const interval = this.schedulerRegistry.getInterval(this.token);
        if (interval) {
            this.logger.warn(`Persistence interval for '${this.token}' already exists. Aborting setup.`);
            return;
        }
        const ONE_MINUTE = 60_000;
        const { intervalMs = ONE_MINUTE, maxConsecutiveFailures = 3 } = this.options;

        const callback = async () => {
            const success = await this.config.persist();
            if (success) {
                this.consecutiveFailures = 0;
                return;
            }
            this.consecutiveFailures++;
            if (this.consecutiveFailures > maxConsecutiveFailures) {
                this.logger.warn(
                    `Failed to persist '${this.configName}' too many times in a row (${this.consecutiveFailures} attempts). Disabling persistence.`
                );
                this.schedulerRegistry.deleteInterval(this.token);
            }
        };

        this.schedulerRegistry.addInterval(this.token, setInterval(callback, intervalMs));
    }
}
