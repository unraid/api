import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { stat } from 'fs/promises';

import type { ExecaError } from 'execa';
import { type Cache } from 'cache-manager';
import Docker from 'dockerode';
import { execa } from 'execa';

import type { DockerAutostartEntryInput } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { AppError } from '@app/core/errors/app-error.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { getLanIp } from '@app/core/utils/network.js';
import { DockerAutostartService } from '@app/unraid-api/graph/resolvers/docker/docker-autostart.service.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import {
    ContainerPortType,
    ContainerState,
    DockerContainer,
    DockerContainerLogLine,
    DockerContainerLogs,
    DockerContainerPortConflict,
    DockerLanPortConflict,
    DockerNetwork,
    DockerPortConflictContainer,
    DockerPortConflicts,
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
export class DockerService {
    private client: Docker;
    private readonly logger = new Logger(DockerService.name);

    public static readonly CONTAINER_CACHE_KEY = 'docker_containers';
    public static readonly CONTAINER_WITH_SIZE_CACHE_KEY = 'docker_containers_with_size';
    public static readonly NETWORK_CACHE_KEY = 'docker_networks';
    public static readonly CACHE_TTL_SECONDS = 60;
    private static readonly DEFAULT_LOG_TAIL = 200;
    private static readonly MAX_LOG_TAIL = 2000;

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly dockerConfigService: DockerConfigService,
        private readonly notificationsService: NotificationsService,
        private readonly dockerManifestService: DockerManifestService,
        private readonly autostartService: DockerAutostartService
    ) {
        this.client = this.getDockerClient();
    }

    private deduplicateContainerPorts(
        ports: Docker.ContainerInfo['Ports'] | undefined
    ): Docker.ContainerInfo['Ports'] {
        if (!Array.isArray(ports)) {
            return [];
        }

        const seen = new Set<string>();
        const uniquePorts: Docker.ContainerInfo['Ports'] = [];

        for (const port of ports) {
            const key = `${port.PrivatePort ?? ''}-${port.PublicPort ?? ''}-${(port.Type ?? '').toLowerCase()}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            uniquePorts.push(port);
        }

        return uniquePorts;
    }

    private buildPortConflictContainerRef(container: DockerContainer): DockerPortConflictContainer {
        const primaryName = this.autostartService.getContainerPrimaryName(container);
        const fallback = container.names?.[0] ?? container.id;
        const normalized = typeof fallback === 'string' ? fallback.replace(/^\//, '') : container.id;
        return {
            id: container.id,
            name: primaryName || normalized,
        };
    }

    private buildContainerPortConflicts(containers: DockerContainer[]): DockerContainerPortConflict[] {
        const groups = new Map<
            string,
            {
                privatePort: number;
                type: ContainerPortType;
                containers: DockerContainer[];
                seen: Set<string>;
            }
        >();

        for (const container of containers) {
            if (!Array.isArray(container.ports)) {
                continue;
            }
            for (const port of container.ports) {
                if (!port || typeof port.privatePort !== 'number') {
                    continue;
                }
                const type = port.type ?? ContainerPortType.TCP;
                const key = `${port.privatePort}/${type}`;
                let group = groups.get(key);
                if (!group) {
                    group = {
                        privatePort: port.privatePort,
                        type,
                        containers: [],
                        seen: new Set<string>(),
                    };
                    groups.set(key, group);
                }
                if (group.seen.has(container.id)) {
                    continue;
                }
                group.seen.add(container.id);
                group.containers.push(container);
            }
        }

        return Array.from(groups.values())
            .filter((group) => group.containers.length > 1)
            .map((group) => ({
                privatePort: group.privatePort,
                type: group.type,
                containers: group.containers.map((container) =>
                    this.buildPortConflictContainerRef(container)
                ),
            }))
            .sort((a, b) => {
                if (a.privatePort !== b.privatePort) {
                    return a.privatePort - b.privatePort;
                }
                return a.type.localeCompare(b.type);
            });
    }

    private buildLanPortConflicts(containers: DockerContainer[]): DockerLanPortConflict[] {
        const lanIp = getLanIp();
        const groups = new Map<
            string,
            {
                lanIpPort: string;
                publicPort: number;
                type: ContainerPortType;
                containers: DockerContainer[];
                seen: Set<string>;
            }
        >();

        for (const container of containers) {
            if (!Array.isArray(container.ports)) {
                continue;
            }
            for (const port of container.ports) {
                if (!port || typeof port.publicPort !== 'number') {
                    continue;
                }
                const type = port.type ?? ContainerPortType.TCP;
                const lanIpPort = lanIp ? `${lanIp}:${port.publicPort}` : `${port.publicPort}`;
                const key = `${lanIpPort}/${type}`;
                let group = groups.get(key);
                if (!group) {
                    group = {
                        lanIpPort,
                        publicPort: port.publicPort,
                        type,
                        containers: [],
                        seen: new Set<string>(),
                    };
                    groups.set(key, group);
                }
                if (group.seen.has(container.id)) {
                    continue;
                }
                group.seen.add(container.id);
                group.containers.push(container);
            }
        }

        return Array.from(groups.values())
            .filter((group) => group.containers.length > 1)
            .map((group) => ({
                lanIpPort: group.lanIpPort,
                publicPort: group.publicPort,
                type: group.type,
                containers: group.containers.map((container) =>
                    this.buildPortConflictContainerRef(container)
                ),
            }))
            .sort((a, b) => {
                if ((a.publicPort ?? 0) !== (b.publicPort ?? 0)) {
                    return (a.publicPort ?? 0) - (b.publicPort ?? 0);
                }
                return a.type.localeCompare(b.type);
            });
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
        return this.autostartService.getAutoStarts();
    }

    public transformContainer(container: Docker.ContainerInfo): DockerContainer {
        const sizeValue = (container as Docker.ContainerInfo & { SizeRootFs?: number }).SizeRootFs;
        const primaryName = this.autostartService.getContainerPrimaryName(container) ?? '';
        const autoStartEntry = primaryName
            ? this.autostartService.getAutoStartEntry(primaryName)
            : undefined;
        const lanIp = getLanIp();
        const lanPortStrings: string[] = [];
        const uniquePorts = this.deduplicateContainerPorts(container.Ports);

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

        const transformed: DockerContainer = {
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

    public async getPortConflicts({
        skipCache = false,
    }: {
        skipCache?: boolean;
    } = {}): Promise<DockerPortConflicts> {
        const containers = await this.getContainers({ skipCache });
        return {
            containerPorts: this.buildContainerPortConflicts(containers),
            lanPorts: this.buildLanPortConflicts(containers),
        };
    }

    public async getContainerLogSizes(containerNames: string[]): Promise<Map<string, number>> {
        const logSizes = new Map<string, number>();
        if (!Array.isArray(containerNames) || containerNames.length === 0) {
            return logSizes;
        }

        for (const rawName of containerNames) {
            const normalized = (rawName ?? '').replace(/^\//, '');
            if (!normalized) {
                logSizes.set(normalized, 0);
                continue;
            }

            try {
                const container = this.client.getContainer(normalized);
                const info = await container.inspect();
                const logPath = info.LogPath;

                if (!logPath || typeof logPath !== 'string' || !logPath.length) {
                    logSizes.set(normalized, 0);
                    continue;
                }

                const stats = await stat(logPath).catch(() => null);
                logSizes.set(normalized, stats?.size ?? 0);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error ?? 'unknown error');
                this.logger.debug(
                    `Failed to determine log size for container ${normalized}: ${message}`
                );
                logSizes.set(normalized, 0);
            }
        }

        return logSizes;
    }

    public async getContainerLogs(
        id: string,
        options?: { since?: Date | null; tail?: number | null }
    ): Promise<DockerContainerLogs> {
        const normalizedId = (id ?? '').trim();
        if (!normalizedId) {
            throw new AppError('Container id is required to fetch logs.', 400);
        }

        const tail = this.normalizeLogTail(options?.tail);
        const args = ['logs', '--timestamps', '--tail', String(tail)];
        const sinceIso = options?.since instanceof Date ? options.since.toISOString() : null;
        if (sinceIso) {
            args.push('--since', sinceIso);
        }
        args.push(normalizedId);

        try {
            const { stdout } = await execa('docker', args);
            const lines = this.parseDockerLogOutput(stdout);
            const cursor =
                lines.length > 0 ? lines[lines.length - 1].timestamp : (options?.since ?? null);

            return {
                containerId: normalizedId,
                lines,
                cursor: cursor ?? undefined,
            };
        } catch (error: unknown) {
            const execaError = error as ExecaError;
            const stderr = typeof execaError?.stderr === 'string' ? execaError.stderr.trim() : '';
            const message = stderr || execaError?.message || 'Unknown error';
            this.logger.error(
                `Failed to fetch logs for container ${normalizedId}: ${message}`,
                execaError
            );
            throw new AppError(`Failed to fetch logs for container ${normalizedId}.`);
        }
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

    private normalizeLogTail(tail?: number | null): number {
        if (typeof tail !== 'number' || Number.isNaN(tail)) {
            return DockerService.DEFAULT_LOG_TAIL;
        }
        const coerced = Math.floor(tail);
        if (!Number.isFinite(coerced) || coerced <= 0) {
            return DockerService.DEFAULT_LOG_TAIL;
        }
        return Math.min(coerced, DockerService.MAX_LOG_TAIL);
    }

    private parseDockerLogOutput(output: string): DockerContainerLogLine[] {
        if (!output) {
            return [];
        }
        return output
            .split(/\r?\n/g)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => this.parseDockerLogLine(line))
            .filter((entry): entry is DockerContainerLogLine => Boolean(entry));
    }

    private parseDockerLogLine(line: string): DockerContainerLogLine | null {
        const trimmed = line.trim();
        if (!trimmed.length) {
            return null;
        }
        const firstSpaceIndex = trimmed.indexOf(' ');
        if (firstSpaceIndex === -1) {
            return {
                timestamp: new Date(),
                message: trimmed,
            };
        }
        const potentialTimestamp = trimmed.slice(0, firstSpaceIndex);
        const message = trimmed.slice(firstSpaceIndex + 1);
        const parsedTimestamp = new Date(potentialTimestamp);
        if (Number.isNaN(parsedTimestamp.getTime())) {
            return {
                timestamp: new Date(),
                message: trimmed,
            };
        }
        return {
            timestamp: parsedTimestamp,
            message,
        };
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
