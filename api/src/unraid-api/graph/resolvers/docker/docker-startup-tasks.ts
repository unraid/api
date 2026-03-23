import type { Type } from '@nestjs/common';

import { ContainerStatusJob } from '@app/unraid-api/graph/resolvers/docker/container-status.job.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';

const DEFAULT_DOCKER_STARTUP_DELAY_MS = 5_000;

interface NestAppGetter {
    get(
        typeOrToken: unknown,
        options?: {
            strict?: boolean;
        }
    ): unknown;
}

interface DockerStartupLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (error: unknown, message: string, ...args: unknown[]) => void;
}

const getOptionalProvider = <T>(app: NestAppGetter, token: Type<T>): T | null => {
    try {
        return app.get(token, { strict: false }) as T;
    } catch {
        return null;
    }
};

export const scheduleDockerStartupTasks = (
    app: NestAppGetter,
    logger: DockerStartupLogger,
    delayMs = DEFAULT_DOCKER_STARTUP_DELAY_MS
): void => {
    const dockerTemplateScannerService = getOptionalProvider(app, DockerTemplateScannerService);
    const containerStatusJob = getOptionalProvider(app, ContainerStatusJob);

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
