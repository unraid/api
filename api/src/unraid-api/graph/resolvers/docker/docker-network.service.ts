import { Injectable, Logger } from '@nestjs/common';

import { catchHandlers } from '@app/core/utils/misc/catch-handlers.js';
import { DockerNetwork } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { getDockerClient } from '@app/unraid-api/graph/resolvers/docker/utils/docker-client.js';

@Injectable()
export class DockerNetworkService {
    private readonly logger = new Logger(DockerNetworkService.name);
    private readonly client = getDockerClient();

    /**
     * Get all Docker networks
     * @returns All the in/active Docker networks on the system.
     */
    public async getNetworks(): Promise<DockerNetwork[]> {
        this.logger.debug('Fetching docker networks');
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

        return networks;
    }
}
