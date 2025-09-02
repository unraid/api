import { Logger } from '@nestjs/common';
import { Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { AppError } from '@app/core/errors/app-error.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

@Resolver(() => DockerContainer)
export class DockerContainerResolver {
    private readonly logger = new Logger(DockerContainerResolver.name);
    constructor(private readonly dockerManifestService: DockerManifestService) {}

    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => Boolean, { nullable: true })
    public async isUpdateAvailable(@Parent() container: DockerContainer) {
        try {
            return await this.dockerManifestService.isUpdateAvailableCached(container.image);
        } catch (error) {
            this.logger.error(error);
            throw new AppError('Failed to read cached update status. See graphql-api.log for details.');
        }
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

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.DOCKER,
        possession: AuthPossession.ANY,
    })
    @Mutation(() => Boolean)
    public async refreshDockerDigests() {
        return this.dockerManifestService.refreshDigests();
    }
}
