import { Logger } from '@nestjs/common';
import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthAction, UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { AppError } from '@app/core/errors/app-error.js';
import { getLanIp } from '@app/core/utils/network.js';
import { UseFeatureFlag } from '@app/unraid-api/decorators/use-feature-flag.decorator.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerTailscaleService } from '@app/unraid-api/graph/resolvers/docker/docker-tailscale.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import {
    ContainerState,
    DockerContainer,
    TailscaleStatus,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

@Resolver(() => DockerContainer)
export class DockerContainerResolver {
    private readonly logger = new Logger(DockerContainerResolver.name);
    constructor(
        private readonly dockerManifestService: DockerManifestService,
        private readonly dockerTemplateScannerService: DockerTemplateScannerService,
        private readonly dockerTailscaleService: DockerTailscaleService
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
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => String, { nullable: true, description: 'Shell to use for console access' })
    public async shell(@Parent() container: DockerContainer): Promise<string | null> {
        if (!container.templatePath) return null;
        const details = await this.dockerTemplateScannerService.getTemplateDetails(
            container.templatePath
        );
        return details?.shell || null;
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => String, {
        nullable: true,
        description: 'Resolved WebUI URL from template',
    })
    public async webUiUrl(@Parent() container: DockerContainer): Promise<string | null> {
        if (!container.templatePath) return null;

        const details = await this.dockerTemplateScannerService.getTemplateDetails(
            container.templatePath
        );

        if (!details?.webUi) return null;

        const lanIp = getLanIp();
        if (!lanIp) return null;

        let resolvedUrl = details.webUi;

        // Replace [IP] placeholder with LAN IP
        resolvedUrl = resolvedUrl.replace(/\[IP\]/g, lanIp);

        // Replace [PORT:XXXX] placeholder
        const portMatch = resolvedUrl.match(/\[PORT:(\d+)\]/);
        if (portMatch) {
            const templatePort = parseInt(portMatch[1], 10);
            let resolvedPort = templatePort;

            // Check if this port is mapped to a public port
            if (container.ports) {
                for (const port of container.ports) {
                    if (port.privatePort === templatePort && port.publicPort) {
                        resolvedPort = port.publicPort;
                        break;
                    }
                }
            }

            resolvedUrl = resolvedUrl.replace(/\[PORT:\d+\]/g, String(resolvedPort));
        }

        return resolvedUrl;
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

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => Boolean, { description: 'Whether Tailscale is enabled for this container' })
    public tailscaleEnabled(@Parent() container: DockerContainer): boolean {
        // Check for Tailscale hostname label (set when hostname is explicitly configured)
        if (container.labels?.['net.unraid.docker.tailscale.hostname']) {
            return true;
        }

        // Check for Tailscale hook mount - look for the source path which is an Unraid system path
        // The hook is mounted from /usr/local/share/docker/tailscale_container_hook
        const mounts = container.mounts ?? [];
        return mounts.some((mount: Record<string, unknown>) => {
            const source = (mount?.Source ?? mount?.source) as string | undefined;
            return source?.includes('tailscale_container_hook');
        });
    }

    @UseFeatureFlag('ENABLE_NEXT_DOCKER_RELEASE')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.DOCKER,
    })
    @ResolveField(() => TailscaleStatus, {
        nullable: true,
        description: 'Tailscale status for this container (fetched via docker exec)',
    })
    public async tailscaleStatus(
        @Parent() container: DockerContainer,
        @Args('forceRefresh', { type: () => Boolean, nullable: true, defaultValue: false })
        forceRefresh: boolean
    ): Promise<TailscaleStatus | null> {
        // First check if Tailscale is enabled
        if (!this.tailscaleEnabled(container)) {
            return null;
        }

        const labels = container.labels ?? {};
        const hostname = labels['net.unraid.docker.tailscale.hostname'];

        if (container.state !== ContainerState.RUNNING) {
            return {
                online: false,
                hostname: hostname || undefined,
                isExitNode: false,
                updateAvailable: false,
                keyExpired: false,
            };
        }

        const containerName = container.names[0];
        if (!containerName) {
            return null;
        }

        return this.dockerTailscaleService.getTailscaleStatus(containerName, labels, forceRefresh);
    }
}
