import { Test } from '@nestjs/testing';

import { describe, expect, it, vi } from 'vitest';

import type { AppReadyEvent } from '@app/unraid-api/app/app-lifecycle.events.js';
import { ContainerStatusJob } from '@app/unraid-api/graph/resolvers/docker/container-status.job.js';
import {
    DockerStartupTasksListener,
    scheduleDockerStartupTasks,
} from '@app/unraid-api/graph/resolvers/docker/docker-startup-tasks.js';
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

        scheduleDockerStartupTasks(
            {
                dockerTemplateScannerService: { bootstrapScan },
                containerStatusJob: { refreshContainerDigestsAfterStartup },
            },
            logger,
            250
        );

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

        scheduleDockerStartupTasks(
            {
                dockerTemplateScannerService: {
                    bootstrapScan: vi.fn().mockRejectedValue(backgroundError),
                },
                containerStatusJob: {
                    refreshContainerDigestsAfterStartup: vi.fn().mockResolvedValue(undefined),
                },
            },
            logger,
            250
        );

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

        expect(() => scheduleDockerStartupTasks({}, logger)).not.toThrow();
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });
});

describe('DockerStartupTasksListener', () => {
    it('schedules docker startup work when the app ready event is emitted', async () => {
        vi.useFakeTimers();

        const bootstrapScan = vi.fn().mockResolvedValue(undefined);
        const refreshContainerDigestsAfterStartup = vi.fn().mockResolvedValue(undefined);
        const module = await Test.createTestingModule({
            providers: [
                DockerStartupTasksListener,
                {
                    provide: DockerTemplateScannerService,
                    useValue: { bootstrapScan },
                },
                {
                    provide: ContainerStatusJob,
                    useValue: { refreshContainerDigestsAfterStartup },
                },
            ],
        }).compile();
        const listener = module.get(DockerStartupTasksListener);
        const event: AppReadyEvent = {
            reason: 'nestjs-server-listening',
        };

        listener.handleAppReady(event);

        await vi.advanceTimersByTimeAsync(5_000);

        expect(bootstrapScan).toHaveBeenCalledTimes(1);
        expect(refreshContainerDigestsAfterStartup).toHaveBeenCalledTimes(1);

        await module.close();
        vi.useRealTimers();
    });
});
