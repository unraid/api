import { Module } from '@nestjs/common';

import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

@Module({
    providers: [
        // Services
        DockerService,
        // DockerEventService,

        // Resolvers
        DockerResolver,
        DockerMutationsResolver,
    ],
    exports: [DockerService],
})
export class DockerModule {}
