import { describe, expect, it, vi } from 'vitest';

import type { AppReadyEvent } from '@app/unraid-api/app/app-lifecycle.events.js';
import { TemperatureStartupTasksListener, scheduleTemperatureStartupTasks } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-startup-tasks.js';

describe('scheduleTemperatureStartupTasks', () => {
    it('schedules temperature startup work after the provided delay', async () => {
        vi.useFakeTimers();

        const initializeProviders = vi.fn().mockResolvedValue(undefined);
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        scheduleTemperatureStartupTasks({ initializeProviders }, logger, 250);

        expect(initializeProviders).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(250);

        expect(initializeProviders).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    it('warns when background temperature startup rejects', async () => {
        vi.useFakeTimers();

        const backgroundError = new Error('disk scan failed');
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        scheduleTemperatureStartupTasks(
            {
                initializeProviders: vi.fn().mockRejectedValue(backgroundError),
            },
            logger,
            250
        );

        await vi.advanceTimersByTimeAsync(250);
        await vi.runAllTicks();

        expect(logger.warn).toHaveBeenCalledWith(
            backgroundError,
            'Temperature provider initialization after startup failed'
        );

        vi.useRealTimers();
    });

    it('does nothing when the temperature service is unavailable', () => {
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        expect(() => scheduleTemperatureStartupTasks(undefined, logger)).not.toThrow();
        expect(logger.info).not.toHaveBeenCalled();
    });
});

describe('TemperatureStartupTasksListener', () => {
    it('schedules temperature startup work when the app ready event is emitted', async () => {
        vi.useFakeTimers();

        const initializeProviders = vi.fn().mockResolvedValue(undefined);
        const listener = new TemperatureStartupTasksListener({ initializeProviders });
        const event: AppReadyEvent = {
            reason: 'nestjs-server-listening',
        };

        listener.handleAppReady(event);

        await vi.advanceTimersByTimeAsync(0);

        expect(initializeProviders).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
