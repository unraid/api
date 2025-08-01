import { Module } from '@nestjs/common';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

@Module({
    providers: [
        // Services
        DockerService,
        DockerConfigService,
        DockerOrganizerService,
        // DockerEventService,

        // Resolvers
        DockerResolver,
        DockerMutationsResolver,
    ],
    exports: [DockerService],
})
export class DockerModule {}
