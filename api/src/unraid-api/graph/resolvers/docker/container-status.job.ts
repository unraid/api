import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry, Timeout } from '@nestjs/schedule';

import { CronJob } from 'cron';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';

@Injectable()
export class ContainerStatusJob implements OnApplicationBootstrap {
    private readonly logger = new Logger(ContainerStatusJob.name);
    constructor(
        private readonly dockerManifestService: DockerManifestService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly dockerConfigService: DockerConfigService
    ) {}

    onApplicationBootstrap() {
        const cronExpression = this.dockerConfigService.getConfig().updateCheckCronSchedule;
        const cronJob = CronJob.from({
            cronTime: cronExpression,
            onTick: () => {
                this.dockerManifestService.refreshDigests();
            },
            start: true,
        });
        this.schedulerRegistry.addCronJob(ContainerStatusJob.name, cronJob);
        this.logger.verbose(
            `Initialized cron job for refreshing container update status: ${ContainerStatusJob.name}`
        );
    }

    /**
     * Refresh container digests 5 seconds after application start.
     */
    @Timeout(5_000)
    async refreshContainerDigestsAfterStartup() {
        await this.dockerManifestService.refreshDigests();
    }
}
