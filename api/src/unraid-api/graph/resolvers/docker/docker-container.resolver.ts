import { Logger } from '@nestjs/common';
import { Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthAction, UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { AppError } from '@app/core/errors/app-error.js';
import { UseFeatureFlag } from '@app/unraid-api/decorators/use-feature-flag.decorator.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

@Resolver(() => DockerContainer)
export class DockerContainerResolver {
    private readonly logger = new Logger(DockerContainerResolver.name);
    constructor(
        private readonly dockerManifestService: DockerManifestService,
        private readonly dockerTemplateScannerService: DockerTemplateScannerService
    ) {}

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
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

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => Boolean, { nullable: true })
    public async isRebuildReady(@Parent() container: DockerContainer) {
        return this.dockerManifestService.isRebuildReady(container.hostConfig?.networkMode);
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => String, { nullable: true })
    public async projectUrl(@Parent() container: DockerContainer) {
        if (!container.templatePath) return null;
        const details = await this.dockerTemplateScannerService.getTemplateDetails(
            container.templatePath
        );
        return details?.project || null;
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => String, { nullable: true })
    public async registryUrl(@Parent() container: DockerContainer) {
        if (!container.templatePath) return null;
        const details = await this.dockerTemplateScannerService.getTemplateDetails(
            container.templatePath
        );
        return details?.registry || null;
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => String, { nullable: true })
    public async supportUrl(@Parent() container: DockerContainer) {
        if (!container.templatePath) return null;
        const details = await this.dockerTemplateScannerService.getTemplateDetails(
            container.templatePath
        );
        return details?.support || null;
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => String, { nullable: true })
    public async iconUrl(@Parent() container: DockerContainer) {
        if (container.labels?.['net.unraid.docker.icon']) {
            return container.labels['net.unraid.docker.icon'];
        }
        if (!container.templatePath) return null;
        const details = await this.dockerTemplateScannerService.getTemplateDetails(
            container.templatePath
        );
        return details?.icon || null;
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.DOCKER,
    })
    @Mutation(() => Boolean)
    public async refreshDockerDigests() {
        return this.dockerManifestService.refreshDigests();
    }
}
