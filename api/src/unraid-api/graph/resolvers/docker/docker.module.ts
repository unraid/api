import { Module } from '@nestjs/common';

import { ContainerStatusJob } from '@app/unraid-api/graph/resolvers/docker/container-status.job.js';
import { DockerContainerResolver } from '@app/unraid-api/graph/resolvers/docker/docker-container.resolver.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerConfigService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer-config.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';

@Module({
    providers: [
        // Services
        DockerService,
        DockerOrganizerConfigService,
        DockerOrganizerService,
        DockerManifestService,
        DockerPhpService,
        // DockerEventService,

        // Jobs
        ContainerStatusJob,

        // Resolvers
        DockerResolver,
        DockerMutationsResolver,
        DockerContainerResolver,
    ],
    exports: [DockerService],
})
export class DockerModule {}
