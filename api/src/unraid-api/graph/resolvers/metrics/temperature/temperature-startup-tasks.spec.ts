import { describe, expect, it, vi } from 'vitest';

import type { AppReadyEvent } from '@app/unraid-api/app/app-lifecycle.events.js';
import {
    runTemperatureStartupTasks,
    TemperatureStartupTasksListener,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-startup-tasks.js';

describe('runTemperatureStartupTasks', () => {
    it('runs temperature startup work immediately', async () => {
        const initializeProviders = vi.fn().mockResolvedValue(undefined);
        const logger = {
            warn: vi.fn(),
        };

        await runTemperatureStartupTasks({ initializeProviders }, logger);

        expect(initializeProviders).toHaveBeenCalledTimes(1);
    });

    it('warns when temperature startup rejects', async () => {
        const backgroundError = new Error('disk scan failed');
        const logger = {
            warn: vi.fn(),
        };

        await runTemperatureStartupTasks(
            {
                initializeProviders: vi.fn().mockRejectedValue(backgroundError),
            },
            logger
        );

        expect(logger.warn).toHaveBeenCalledWith(
            backgroundError,
            'Temperature provider initialization after startup failed'
        );
    });

    it('does nothing when the temperature service is unavailable', () => {
        const logger = {
            warn: vi.fn(),
        };

        expect(() => runTemperatureStartupTasks(undefined, logger)).not.toThrow();
    });
});

describe('TemperatureStartupTasksListener', () => {
    it('runs temperature startup work when the app ready event is emitted', async () => {
        const initializeProviders = vi.fn().mockResolvedValue(undefined);
        const listener = new TemperatureStartupTasksListener({ initializeProviders });
        const event: AppReadyEvent = {
            reason: 'nestjs-server-listening',
        };

        await listener.handleAppReady(event);

        expect(initializeProviders).toHaveBeenCalledTimes(1);
    });
});
