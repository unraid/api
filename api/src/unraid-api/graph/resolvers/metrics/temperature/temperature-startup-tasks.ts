import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import type { AppReadyEvent } from '@app/unraid-api/app/app-lifecycle.events.js';
import { APP_READY_EVENT } from '@app/unraid-api/app/app-lifecycle.events.js';
import { apiLogger } from '@app/core/log.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';

const DEFAULT_TEMPERATURE_STARTUP_DELAY_MS = 0;

interface TemperatureStartupLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (error: unknown, message: string, ...args: unknown[]) => void;
}

interface TemperatureStartupService {
    initializeProviders: () => Promise<void>;
}

export const scheduleTemperatureStartupTasks = (
    temperatureService: TemperatureStartupService | null | undefined,
    logger: TemperatureStartupLogger,
    delayMs = DEFAULT_TEMPERATURE_STARTUP_DELAY_MS
): void => {
    if (!temperatureService) {
        return;
    }

    logger.info('Scheduling temperature startup tasks to run in %dms', delayMs);

    setTimeout(() => {
        void temperatureService.initializeProviders().catch((error: unknown) => {
            logger.warn(error, 'Temperature provider initialization after startup failed');
        });
    }, delayMs);
};

@Injectable()
export class TemperatureStartupTasksListener {
    constructor(
        @Inject(TemperatureService)
        private readonly temperatureService: TemperatureStartupService
    ) {}

    @OnEvent(APP_READY_EVENT)
    handleAppReady(_event: AppReadyEvent): void {
        scheduleTemperatureStartupTasks(this.temperatureService, apiLogger);
    }
}
