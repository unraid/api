import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import type { AppReadyEvent } from '@app/unraid-api/app/app-lifecycle.events.js';
import { apiLogger } from '@app/core/log.js';
import { APP_READY_EVENT } from '@app/unraid-api/app/app-lifecycle.events.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';

interface TemperatureStartupLogger {
    warn: (error: unknown, message: string, ...args: unknown[]) => void;
}

interface TemperatureStartupService {
    initializeProviders: () => Promise<void>;
}

export const runTemperatureStartupTasks = async (
    temperatureService: TemperatureStartupService | null | undefined,
    logger: TemperatureStartupLogger
): Promise<void> => {
    if (!temperatureService) {
        return;
    }

    try {
        await temperatureService.initializeProviders();
    } catch (error: unknown) {
        logger.warn(error, 'Temperature provider initialization after startup failed');
    }
};

@Injectable()
export class TemperatureStartupTasksListener {
    constructor(
        @Inject(TemperatureService)
        private readonly temperatureService: TemperatureStartupService
    ) {}

    @OnEvent(APP_READY_EVENT, { async: true })
    async handleAppReady(_event: AppReadyEvent): Promise<void> {
        await runTemperatureStartupTasks(this.temperatureService, apiLogger);
    }
}
