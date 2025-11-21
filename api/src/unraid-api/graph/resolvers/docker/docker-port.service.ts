import { Injectable } from '@nestjs/common';

import Docker from 'dockerode';

import { getLanIp } from '@app/core/utils/network.js';
import {
    ContainerPortType,
    DockerContainer,
    DockerContainerPortConflict,
    DockerLanPortConflict,
    DockerPortConflictContainer,
    DockerPortConflicts,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

@Injectable()
export class DockerPortService {
    public deduplicateContainerPorts(
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

    public calculateConflicts(containers: DockerContainer[]): DockerPortConflicts {
        return {
            containerPorts: this.buildContainerPortConflicts(containers),
            lanPorts: this.buildLanPortConflicts(containers),
        };
    }

    private buildPortConflictContainerRef(container: DockerContainer): DockerPortConflictContainer {
        const primaryName = this.getContainerPrimaryName(container);
        const fallback = container.names?.[0] ?? container.id;
        const normalized = typeof fallback === 'string' ? fallback.replace(/^\//, '') : container.id;
        return {
            id: container.id,
            name: primaryName || normalized,
        };
    }

    private getContainerPrimaryName(container: DockerContainer): string | null {
        const names = container.names;
        const firstName = names?.[0] ?? '';
        return firstName ? firstName.replace(/^\//, '') : null;
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
}
