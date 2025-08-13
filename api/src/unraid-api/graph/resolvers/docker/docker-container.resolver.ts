import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';
import { GraphQLJSON } from 'graphql-scalars';

import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerOrganizerService } from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import { DockerPhpService } from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';
import {
    Docker,
    DockerContainer,
    DockerNetwork,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DEFAULT_ORGANIZER_ROOT_ID } from '@app/unraid-api/organizer/organizer.js';
import { OrganizerV1, ResolvedOrganizerV1 } from '@app/unraid-api/organizer/organizer.model.js';

@Resolver(() => DockerContainer)
export class DockerContainerResolver {
    constructor(private readonly dockerManifestService: DockerManifestService) {}

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { nullable: true })
    public async isUpdateAvailable(@Parent() container: DockerContainer) {
        return this.dockerManifestService.isUpdateAvailable(container.image);
    }

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { nullable: true })
    public async isRebuildReady(@Parent() container: DockerContainer) {
        return this.dockerManifestService.isRebuildReady(container.hostConfig?.networkMode);
    }
}
