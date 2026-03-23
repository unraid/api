import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import type { AppReadyEvent } from '@app/unraid-api/app/app-lifecycle.events.js';
import { apiLogger } from '@app/core/log.js';
import { APP_READY_EVENT } from '@app/unraid-api/app/app-lifecycle.events.js';
import { ContainerStatusJob } from '@app/unraid-api/graph/resolvers/docker/container-status.job.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';

const DEFAULT_DOCKER_STARTUP_DELAY_MS = 5_000;

interface DockerStartupTasksDependencies {
    containerStatusJob?: Pick<ContainerStatusJob, 'refreshContainerDigestsAfterStartup'> | null;
    dockerTemplateScannerService?: Pick<DockerTemplateScannerService, 'bootstrapScan'> | null;
}

interface DockerStartupLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (error: unknown, message: string, ...args: unknown[]) => void;
}

export const scheduleDockerStartupTasks = (
    { dockerTemplateScannerService, containerStatusJob }: DockerStartupTasksDependencies,
    logger: DockerStartupLogger,
    delayMs = DEFAULT_DOCKER_STARTUP_DELAY_MS
): void => {
    if (!dockerTemplateScannerService && !containerStatusJob) {
        return;
    }

    logger.info('Scheduling Docker startup tasks to run in %dms', delayMs);

    if (dockerTemplateScannerService) {
        setTimeout(() => {
            void dockerTemplateScannerService.bootstrapScan().catch((error: unknown) => {
                logger.warn(error, 'Docker template bootstrap scan failed');
            });
        }, delayMs);
    }

    if (containerStatusJob) {
        setTimeout(() => {
            void containerStatusJob.refreshContainerDigestsAfterStartup().catch((error: unknown) => {
                logger.warn(error, 'Docker container digest refresh after startup failed');
            });
        }, delayMs);
    }
};

@Injectable()
export class DockerStartupTasksListener {
    constructor(
        private readonly dockerTemplateScannerService: DockerTemplateScannerService,
        private readonly containerStatusJob: ContainerStatusJob
    ) {}

    @OnEvent(APP_READY_EVENT)
    handleAppReady(_event: AppReadyEvent): void {
        scheduleDockerStartupTasks(
            {
                dockerTemplateScannerService: this.dockerTemplateScannerService,
                containerStatusJob: this.containerStatusJob,
            },
            apiLogger
        );
    }
}
