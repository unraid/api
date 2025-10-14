import { Module } from '@nestjs/common';

import { JobModule } from '@app/unraid-api/cron/job.module.js';
import { ContainerStatusJob } from '@app/unraid-api/graph/resolvers/docker/container-status.job.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerContainerResolver } from '@app/unraid-api/graph/resolvers/docker/docker-container.resolver.js';
import { DockerFormService } from '@app/unraid-api/graph/resolvers/docker/docker-form.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import { DockerTemplateIconService } from '@app/unraid-api/graph/resolvers/docker/docker-template-icon.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerConfigService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer-config.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';

@Module({
    imports: [JobModule],
    providers: [
        // Services
        DockerService,
        DockerFormService,
        DockerOrganizerConfigService,
        DockerOrganizerService,
        DockerManifestService,
        DockerPhpService,
        DockerConfigService,
        DockerTemplateScannerService,
        DockerTemplateIconService,

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
