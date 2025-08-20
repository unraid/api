import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';

import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';

@Injectable()
export class ContainerStatusJob {
    constructor(private readonly dockerPhpService: DockerPhpService) {}

    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async refreshContainerDigests() {
        await this.dockerPhpService.refreshDigests();
    }

    /**
     * Refresh container digests 5 seconds after application start.
     */
    @Timeout(5_000)
    async refreshContainerDigestsAfterStartup() {
        await this.dockerPhpService.refreshDigests();
    }
}
