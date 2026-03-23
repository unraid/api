import { describe, expect, it, vi } from 'vitest';

import { ContainerStatusJob } from '@app/unraid-api/graph/resolvers/docker/container-status.job.js';
import { scheduleDockerStartupTasks } from '@app/unraid-api/graph/resolvers/docker/docker-startup-tasks.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';

describe('scheduleDockerStartupTasks', () => {
    it('schedules docker startup work after the provided delay', async () => {
        vi.useFakeTimers();

        const bootstrapScan = vi.fn().mockResolvedValue(undefined);
        const refreshContainerDigestsAfterStartup = vi.fn().mockResolvedValue(undefined);
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        const app = {
            get: vi.fn((token) => {
                if (token === DockerTemplateScannerService) {
                    return { bootstrapScan };
                }
                if (token === ContainerStatusJob) {
                    return { refreshContainerDigestsAfterStartup };
                }
                throw new Error('unexpected token');
            }),
        };

        scheduleDockerStartupTasks(app, logger, 250);

        expect(bootstrapScan).not.toHaveBeenCalled();
        expect(refreshContainerDigestsAfterStartup).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(250);

        expect(bootstrapScan).toHaveBeenCalledTimes(1);
        expect(refreshContainerDigestsAfterStartup).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    it('warns when a background docker startup task rejects', async () => {
        vi.useFakeTimers();

        const backgroundError = new Error('docker unavailable');
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        const app = {
            get: vi.fn((token) => {
                if (token === DockerTemplateScannerService) {
                    return {
                        bootstrapScan: vi.fn().mockRejectedValue(backgroundError),
                    };
                }
                if (token === ContainerStatusJob) {
                    return {
                        refreshContainerDigestsAfterStartup: vi.fn().mockResolvedValue(undefined),
                    };
                }
                throw new Error('unexpected token');
            }),
        };

        scheduleDockerStartupTasks(app, logger, 250);

        await vi.advanceTimersByTimeAsync(250);
        await vi.runAllTicks();

        expect(logger.warn).toHaveBeenCalledWith(
            backgroundError,
            'Docker template bootstrap scan failed'
        );

        vi.useRealTimers();
    });

    it('does nothing when docker providers are unavailable', () => {
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
        };

        const app = {
            get: vi.fn(() => {
                throw new Error('provider missing');
            }),
        };

        expect(() => scheduleDockerStartupTasks(app, logger)).not.toThrow();
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });
});
