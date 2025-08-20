import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';

import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';

@Injectable()
export class ContainerStatusJob {
    constructor(private readonly dockerManifestService: DockerManifestService) {}

    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async refreshContainerDigests() {
        await this.dockerManifestService.refreshDigests();
    }

    /**
     * Refresh container digests 5 seconds after application start.
     */
    @Timeout(5_000)
    async refreshContainerDigestsAfterStartup() {
        await this.dockerManifestService.refreshDigests();
    }
}
