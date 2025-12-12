import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { GRAPHQL_PUBSUB_CHANNEL } from '@unraid/shared/pubsub/graphql.pubsub.js';
import { type Cache } from 'cache-manager';
import Docker from 'dockerode';
import { execa } from 'execa';

import { AppError } from '@app/core/errors/app-error.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { getLanIp } from '@app/core/utils/network.js';
import { DockerAutostartService } from '@app/unraid-api/graph/resolvers/docker/docker-autostart.service.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerLogService } from '@app/unraid-api/graph/resolvers/docker/docker-log.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerNetworkService } from '@app/unraid-api/graph/resolvers/docker/docker-network.service.js';
import { DockerPortService } from '@app/unraid-api/graph/resolvers/docker/docker-port.service.js';
import {
    ContainerPortType,
    ContainerState,
    DockerAutostartEntryInput,
    DockerContainer,
    DockerContainerLogs,
    DockerNetwork,
    DockerPortConflicts,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { getDockerClient } from '@app/unraid-api/graph/resolvers/docker/utils/docker-client.js';
import { NotificationImportance } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

interface ContainerListingOptions extends Docker.ContainerListOptions {
    skipCache: boolean;
}

interface NetworkListingOptions {
    skipCache: boolean;
}

@Injectable()
export class DockerService {
    private client: Docker;
    private readonly logger = new Logger(DockerService.name);

    public static readonly CONTAINER_CACHE_KEY = 'docker_containers';
    public static readonly CONTAINER_WITH_SIZE_CACHE_KEY = 'docker_containers_with_size';
    public static readonly NETWORK_CACHE_KEY = 'docker_networks';
    public static readonly CACHE_TTL_SECONDS = 60;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly dockerConfigService: DockerConfigService,
        private readonly notificationsService: NotificationsService,
        private readonly dockerManifestService: DockerManifestService,
        private readonly autostartService: DockerAutostartService,
        private readonly dockerLogService: DockerLogService,
        private readonly dockerNetworkService: DockerNetworkService,
        private readonly dockerPortService: DockerPortService
    ) {
        this.client = getDockerClient();
    }

    public async getAppInfo() {
        const containers = await this.getContainers({ skipCache: false });
        const installedCount = containers.length;
        const runningCount = containers.filter(
            (container) => container.state === ContainerState.RUNNING
        ).length;
        return {
            info: {
                apps: { installed: installedCount, running: runningCount },
            },
        };
    }

    /**
     * Docker auto start file
     *
     * @note Doesn't exist if array is offline.
     * @see https://github.com/limetech/webgui/issues/502#issue-480992547
     */
    public async getAutoStarts(): Promise<string[]> {
        return this.autostartService.getAutoStarts();
    }

    public transformContainer(container: Docker.ContainerInfo): Omit<DockerContainer, 'isOrphaned'> {
        const sizeValue = (container as Docker.ContainerInfo & { SizeRootFs?: number }).SizeRootFs;
        const primaryName = this.autostartService.getContainerPrimaryName(container) ?? '';
        const autoStartEntry = primaryName
            ? this.autostartService.getAutoStartEntry(primaryName)
            : undefined;
        const lanIp = getLanIp();
        const lanPortStrings: string[] = [];
        const uniquePorts = this.dockerPortService.deduplicateContainerPorts(container.Ports);

        const transformedPorts = uniquePorts.map((port) => {
            if (port.PublicPort) {
                const lanPort = lanIp ? `${lanIp}:${port.PublicPort}` : `${port.PublicPort}`;
                if (lanPort) {
                    lanPortStrings.push(lanPort);
                }
            }
            return {
                ip: port.IP || '',
                privatePort: port.PrivatePort,
                publicPort: port.PublicPort,
                type:
                    ContainerPortType[port.Type.toUpperCase() as keyof typeof ContainerPortType] ||
                    ContainerPortType.TCP,
            };
        });

        const transformed: Omit<DockerContainer, 'isOrphaned'> = {
            id: container.Id,
            names: container.Names,
            image: container.Image,
            imageId: container.ImageID,
            command: container.Command,
            created: container.Created,
            ports: transformedPorts,
            sizeRootFs: sizeValue,
            sizeRw: (container as Docker.ContainerInfo & { SizeRw?: number }).SizeRw,
            labels: container.Labels ?? {},
            state:
                typeof container.State === 'string'
                    ? (ContainerState[container.State.toUpperCase() as keyof typeof ContainerState] ??
                      ContainerState.EXITED)
                    : ContainerState.EXITED,
            status: container.Status,
            hostConfig: {
                networkMode: container.HostConfig?.NetworkMode || '',
            },
            networkSettings: container.NetworkSettings,
            mounts: container.Mounts,
            autoStart: Boolean(autoStartEntry),
            autoStartOrder: autoStartEntry?.order,
            autoStartWait: autoStartEntry?.wait,
        };

        if (lanPortStrings.length > 0) {
            transformed.lanIpPorts = lanPortStrings;
        }

        return transformed;
    }

    public async getContainers(
        {
            skipCache = false,
            all = true,
            size = false,
            ...listOptions
        }: Partial<ContainerListingOptions> = { skipCache: false }
    ): Promise<DockerContainer[]> {
        const cacheKey = size
            ? DockerService.CONTAINER_WITH_SIZE_CACHE_KEY
            : DockerService.CONTAINER_CACHE_KEY;

        if (!skipCache) {
            const cachedContainers = await this.cacheManager.get<DockerContainer[]>(cacheKey);
            if (cachedContainers) {
                this.logger.debug(`Using docker container cache (${size ? 'with' : 'without'} size)`);
                return cachedContainers;
            }
        }

        this.logger.debug(`Updating docker container cache (${size ? 'with' : 'without'} size)`);
        let rawContainers: Docker.ContainerInfo[] = [];
        try {
            rawContainers = await this.client.listContainers({
                all,
                size,
                ...listOptions,
            });
        } catch (error) {
            await this.handleDockerListError(error);
        }

        await this.autostartService.refreshAutoStartEntries();
        const containers = rawContainers.map((container) => this.transformContainer(container));

        const config = this.dockerConfigService.getConfig();
        const containersWithTemplatePaths = containers.map((c) => {
            const containerName = c.names[0]?.replace(/^\//, '').toLowerCase();
            const templatePath = config.templateMappings?.[containerName] || undefined;
            return {
                ...c,
                templatePath,
                isOrphaned: !templatePath,
            };
        });

        await this.cacheManager.set(
            cacheKey,
            containersWithTemplatePaths,
            DockerService.CACHE_TTL_SECONDS * 1000
        );
        return containersWithTemplatePaths;
    }

    public async getPortConflicts({
        skipCache = false,
    }: {
        skipCache?: boolean;
    } = {}): Promise<DockerPortConflicts> {
        const containers = await this.getContainers({ skipCache });
        return this.dockerPortService.calculateConflicts(containers);
    }

    public async getContainerLogSizes(containerNames: string[]): Promise<Map<string, number>> {
        return this.dockerLogService.getContainerLogSizes(containerNames);
    }

    public async getContainerLogs(
        id: string,
        options?: { since?: Date | null; tail?: number | null }
    ): Promise<DockerContainerLogs> {
        return this.dockerLogService.getContainerLogs(id, options);
    }

    /**
     * Get all Docker networks
     * @returns All the in/active Docker networks on the system.
     */
    public async getNetworks(options: NetworkListingOptions): Promise<DockerNetwork[]> {
        return this.dockerNetworkService.getNetworks(options);
    }

    public async clearContainerCache(): Promise<void> {
        await Promise.all([
            this.cacheManager.del(DockerService.CONTAINER_CACHE_KEY),
            this.cacheManager.del(DockerService.CONTAINER_WITH_SIZE_CACHE_KEY),
        ]);
        this.logger.debug('Invalidated container caches due to external event.');
    }

    public async start(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.start();
        await this.clearContainerCache();
        this.logger.debug(`Invalidated container caches after starting ${id}`);
        const containers = await this.getContainers({ skipCache: true });
        const updatedContainer = containers.find((c) => c.id === id);
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after starting`);
        }
        const appInfo = await this.getAppInfo();
        await pubsub.publish(GRAPHQL_PUBSUB_CHANNEL.INFO, appInfo);
        return updatedContainer;
    }

    public async removeContainer(id: string, options?: { withImage?: boolean }): Promise<boolean> {
        const container = this.client.getContainer(id);
        try {
            const inspectData = options?.withImage ? await container.inspect() : null;
            const imageId = inspectData?.Image;

            await container.remove({ force: true });
            this.logger.debug(`Removed container ${id}`);

            if (options?.withImage && imageId) {
                try {
                    const image = this.client.getImage(imageId);
                    await image.remove({ force: true });
                    this.logger.debug(`Removed image ${imageId} for container ${id}`);
                } catch (imageError) {
                    this.logger.warn(`Failed to remove image ${imageId}:`, imageError);
                }
            }

            await this.clearContainerCache();
            this.logger.debug(`Invalidated container caches after removing ${id}`);
            const appInfo = await this.getAppInfo();
            await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
            return true;
        } catch (error) {
            this.logger.error(`Failed to remove container ${id}:`, error);
            throw new Error(`Failed to remove container ${id}`);
        }
    }

    public async updateAutostartConfiguration(
        entries: DockerAutostartEntryInput[],
        options?: { persistUserPreferences?: boolean }
    ): Promise<void> {
        const containers = await this.getContainers({ skipCache: true });
        await this.autostartService.updateAutostartConfiguration(entries, containers, options);
        await this.clearContainerCache();
    }

    public async stop(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.stop({ t: 10 });
        await this.clearContainerCache();
        this.logger.debug(`Invalidated container caches after stopping ${id}`);

        let containers = await this.getContainers({ skipCache: true });
        let updatedContainer: DockerContainer | undefined;
        for (let i = 0; i < 5; i++) {
            await sleep(500);
            containers = await this.getContainers({ skipCache: true });
            updatedContainer = containers.find((c) => c.id === id);
            this.logger.debug(
                `Container ${id} state after stop attempt ${i + 1}: ${updatedContainer?.state}`
            );
            if (updatedContainer?.state === ContainerState.EXITED) {
                break;
            }
        }

        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after stopping`);
        } else if (updatedContainer.state !== ContainerState.EXITED) {
            this.logger.warn(`Container ${id} did not reach EXITED state after stop command.`);
        }
        const appInfo = await this.getAppInfo();
        await pubsub.publish(GRAPHQL_PUBSUB_CHANNEL.INFO, appInfo);
        return updatedContainer;
    }

    public async pause(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.pause();
        await this.cacheManager.del(DockerService.CONTAINER_CACHE_KEY);
        this.logger.debug(`Invalidated container cache after pausing ${id}`);

        let containers = await this.getContainers({ skipCache: true });
        let updatedContainer: DockerContainer | undefined;
        for (let i = 0; i < 5; i++) {
            await sleep(500);
            containers = await this.getContainers({ skipCache: true });
            updatedContainer = containers.find((c) => c.id === id);
            this.logger.debug(
                `Container ${id} state after pause attempt ${i + 1}: ${updatedContainer?.state}`
            );
            if (updatedContainer?.state === ContainerState.PAUSED) {
                break;
            }
        }

        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after pausing`);
        }
        const appInfo = await this.getAppInfo();
        await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
        return updatedContainer;
    }

    public async unpause(id: string): Promise<DockerContainer> {
        const container = this.client.getContainer(id);
        await container.unpause();
        await this.cacheManager.del(DockerService.CONTAINER_CACHE_KEY);
        this.logger.debug(`Invalidated container cache after unpausing ${id}`);

        let containers = await this.getContainers({ skipCache: true });
        let updatedContainer: DockerContainer | undefined;
        for (let i = 0; i < 5; i++) {
            await sleep(500);
            containers = await this.getContainers({ skipCache: true });
            updatedContainer = containers.find((c) => c.id === id);
            this.logger.debug(
                `Container ${id} state after unpause attempt ${i + 1}: ${updatedContainer?.state}`
            );
            if (updatedContainer?.state === ContainerState.RUNNING) {
                break;
            }
        }

        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after unpausing`);
        }
        const appInfo = await this.getAppInfo();
        await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
        return updatedContainer;
    }

    public async updateContainer(id: string): Promise<DockerContainer> {
        const containers = await this.getContainers({ skipCache: true });
        const container = containers.find((c) => c.id === id);
        if (!container) {
            throw new Error(`Container ${id} not found`);
        }

        const containerName = container.names?.[0]?.replace(/^\//, '');
        if (!containerName) {
            throw new Error(`Container ${id} has no name`);
        }

        this.logger.log(`Updating container ${containerName} (${id})`);

        try {
            await execa(
                '/usr/local/emhttp/plugins/dynamix.docker.manager/scripts/update_container',
                [encodeURIComponent(containerName)],
                { shell: 'bash' }
            );
        } catch (error) {
            this.logger.error(`Failed to update container ${containerName}:`, error);
            throw new Error(`Failed to update container ${containerName}`);
        }

        await this.clearContainerCache();
        this.logger.debug(`Invalidated container caches after updating ${id}`);

        const updatedContainers = await this.getContainers({ skipCache: true });
        const updatedContainer = updatedContainers.find(
            (c) => c.names?.some((name) => name.replace(/^\//, '') === containerName) || c.id === id
        );
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after update`);
        }

        const appInfo = await this.getAppInfo();
        await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
        return updatedContainer;
    }

    public async updateContainers(ids: string[]): Promise<DockerContainer[]> {
        const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.length)));
        const updatedContainers: DockerContainer[] = [];
        for (const id of uniqueIds) {
            const updated = await this.updateContainer(id);
            updatedContainers.push(updated);
        }
        return updatedContainers;
    }

    /**
     * Updates every container with an available update. Mirrors the legacy webgui "Update All" flow.
     */
    public async updateAllContainers(): Promise<DockerContainer[]> {
        const containers = await this.getContainers({ skipCache: true });
        if (!containers.length) {
            return [];
        }

        const cachedStatuses = await this.dockerManifestService.getCachedUpdateStatuses();
        const idsWithUpdates: string[] = [];

        for (const container of containers) {
            if (!container.image) {
                continue;
            }
            const hasUpdate = await this.dockerManifestService.isUpdateAvailableCached(
                container.image,
                cachedStatuses
            );
            if (hasUpdate) {
                idsWithUpdates.push(container.id);
            }
        }

        if (!idsWithUpdates.length) {
            this.logger.log('Update-all requested but no containers have available updates');
            return [];
        }

        this.logger.log(`Updating ${idsWithUpdates.length} container(s) via updateAllContainers`);
        return this.updateContainers(idsWithUpdates);
    }

    private async handleDockerListError(error: unknown): Promise<never> {
        await this.notifyDockerListError(error);
        catchHandlers.docker(error as NodeJS.ErrnoException);
        throw error instanceof Error ? error : new Error('Docker list error');
    }

    private async notifyDockerListError(error: unknown): Promise<void> {
        const message = this.getDockerErrorMessage(error);
        const truncatedMessage = message.length > 240 ? `${message.slice(0, 237)}...` : message;
        try {
            await this.notificationsService.notifyIfUnique({
                title: 'Docker Container Query Failure',
                subject: truncatedMessage,
                description: `An error occurred while querying Docker containers. ${truncatedMessage}`,
                importance: NotificationImportance.ALERT,
            });
        } catch (notificationError) {
            this.logger.error(
                'Failed to send Docker container query failure notification',
                notificationError as Error
            );
        }
    }

    private getDockerErrorMessage(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        if (typeof error === 'string' && error.length) {
            return error;
        }
        return 'Unknown error occurred.';
    }
}
