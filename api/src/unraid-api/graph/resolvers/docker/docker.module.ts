import { Module } from '@nestjs/common';

import { ContainerStatusJob } from '@app/unraid-api/graph/resolvers/docker/container-status.job.js';
import { DockerAuthService } from '@app/unraid-api/graph/resolvers/docker/docker-auth.service.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerContainerResolver } from '@app/unraid-api/graph/resolvers/docker/docker-container.resolver.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

@Module({
    providers: [
        // Services
        DockerService,
        DockerConfigService,
        DockerOrganizerService,
        DockerAuthService,
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
