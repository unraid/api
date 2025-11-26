import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { type Cache } from 'cache-manager';

import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { DockerNetwork } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { getDockerClient } from '@app/unraid-api/graph/resolvers/docker/utils/docker-client.js';

interface NetworkListingOptions {
    skipCache: boolean;
}

@Injectable()
export class DockerNetworkService {
    private readonly logger = new Logger(DockerNetworkService.name);
    private readonly client = getDockerClient();

    public static readonly NETWORK_CACHE_KEY = 'docker_networks';
    private static readonly CACHE_TTL_SECONDS = 60;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    /**
     * Get all Docker networks
     * @returns All the in/active Docker networks on the system.
     */
    public async getNetworks({ skipCache }: NetworkListingOptions): Promise<DockerNetwork[]> {
        if (!skipCache) {
            const cachedNetworks = await this.cacheManager.get<DockerNetwork[]>(
                DockerNetworkService.NETWORK_CACHE_KEY
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
            DockerNetworkService.NETWORK_CACHE_KEY,
            networks,
            DockerNetworkService.CACHE_TTL_SECONDS * 1000
        );
        return networks;
    }
}
