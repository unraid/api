import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    forwardRef,
    Inject,
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleInit,
} from '@nestjs/common';
import { readFile } from 'fs/promises';

import { type Cache } from 'cache-manager';
import Docker from 'dockerode';
import { execa } from 'execa';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { getters } from '@app/store/index.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import {
    ContainerPortType,
    ContainerState,
    DockerContainer,
    DockerNetwork,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { NotificationImportance } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

interface ContainerListingOptions extends Docker.ContainerListOptions {
    skipCache: boolean;
}

interface NetworkListingOptions {
    skipCache: boolean;
}

@Injectable()
export class DockerService implements OnApplicationBootstrap {
    private client: Docker;
    private autoStarts: string[] = [];
    private readonly logger = new Logger(DockerService.name);

    public static readonly CONTAINER_CACHE_KEY = 'docker_containers';
    public static readonly CONTAINER_WITH_SIZE_CACHE_KEY = 'docker_containers_with_size';
    public static readonly NETWORK_CACHE_KEY = 'docker_networks';
    public static readonly CACHE_TTL_SECONDS = 60;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly dockerConfigService: DockerConfigService,
        @Inject(forwardRef(() => DockerTemplateScannerService))
        private readonly templateScannerService: DockerTemplateScannerService,
        private readonly notificationsService: NotificationsService
    ) {
        this.client = this.getDockerClient();
    }

    async onApplicationBootstrap() {
        await this.templateScannerService.bootstrapScan();
    }

    public getDockerClient() {
        return new Docker({
            socketPath: '/var/run/docker.sock',
        });
    }

    async getAppInfo() {
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
        const autoStartFile = await readFile(getters.paths()['docker-autostart'], 'utf8')
            .then((file) => file.toString())
            .catch(() => '');
        return autoStartFile.split('\n');
    }

    public transformContainer(container: Docker.ContainerInfo): DockerContainer {
        const sizeValue = (container as Docker.ContainerInfo & { SizeRootFs?: number }).SizeRootFs;

        const transformed: DockerContainer = {
            id: container.Id,
            names: container.Names,
            image: container.Image,
            imageId: container.ImageID,
            command: container.Command,
            created: container.Created,
            ports: container.Ports.map((port) => ({
                ip: port.IP || '',
                privatePort: port.PrivatePort,
                publicPort: port.PublicPort,
                type:
                    ContainerPortType[port.Type.toUpperCase() as keyof typeof ContainerPortType] ||
                    ContainerPortType.TCP,
            })),
            sizeRootFs: sizeValue,
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
            autoStart: this.autoStarts.includes(container.Names[0].split('/')[1]),
        };

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

        this.autoStarts = await this.getAutoStarts();
        const containers = rawContainers.map((container) => this.transformContainer(container));

        const config = this.dockerConfigService.getConfig();
        const containersWithTemplatePaths = containers.map((c) => {
            const containerName = c.names[0]?.replace(/^\//, '').toLowerCase();
            return {
                ...c,
                templatePath: config.templateMappings?.[containerName] || undefined,
            };
        });

        await this.cacheManager.set(
            cacheKey,
            containersWithTemplatePaths,
            DockerService.CACHE_TTL_SECONDS * 1000
        );
        return containersWithTemplatePaths;
    }

    /**
     * Get all Docker networks
     * @returns All the in/active Docker networks on the system.
     */
    public async getNetworks({ skipCache }: NetworkListingOptions): Promise<DockerNetwork[]> {
        if (!skipCache) {
            const cachedNetworks = await this.cacheManager.get<DockerNetwork[]>(
                DockerService.NETWORK_CACHE_KEY
            );
            if (cachedNetworks) {
                this.logger.debug('Using docker network cache');
                return cachedNetworks;
            }
        }

        this.logger.debug('Updating docker network cache');
        const rawNetworks = await this.client.listNetworks().catch(catchHandlers.docker);
        const networks = rawNetworks.map(
            (network) =>
                ({
                    name: network.Name || '',
                    id: network.Id || '',
                    created: network.Created || '',
                    scope: network.Scope || '',
                    driver: network.Driver || '',
                    enableIPv6: network.EnableIPv6 || false,
                    ipam: network.IPAM || {},
                    internal: network.Internal || false,
                    attachable: network.Attachable || false,
                    ingress: network.Ingress || false,
                    configFrom: network.ConfigFrom || {},
                    configOnly: network.ConfigOnly || false,
                    containers: network.Containers || {},
                    options: network.Options || {},
                    labels: network.Labels || {},
                }) as DockerNetwork
        );

        await this.cacheManager.set(
            DockerService.NETWORK_CACHE_KEY,
            networks,
            DockerService.CACHE_TTL_SECONDS * 1000
        );
        return networks;
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
        await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
        return updatedContainer;
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
        await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
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
        const updatedContainer = updatedContainers.find((c) => c.id === id);
        if (!updatedContainer) {
            throw new Error(`Container ${id} not found after update`);
        }

        const appInfo = await this.getAppInfo();
        await pubsub.publish(PUBSUB_CHANNEL.INFO, appInfo);
        return updatedContainer;
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
