import { Module } from '@nestjs/common';

import { DockerEventService } from './docker-event.service.js';
import { DockerMutationsResolver } from './docker.mutations.resolver.js';
import { DockerResolver } from './docker.resolver.js';
import { DockerService } from './docker.service.js';

@Module({
  providers: [
    // Services
    DockerService,
    DockerEventService,
    
    // Resolvers
    DockerResolver,
    DockerMutationsResolver
  ],
  exports: [
    DockerService,
    DockerEventService
  ]
})
export class DockerModule {} 