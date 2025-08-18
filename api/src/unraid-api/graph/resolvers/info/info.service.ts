import { Injectable } from '@nestjs/common';

import {
    cpu,
    cpuFlags,
    mem,
    memLayout,
    osInfo,
    versions,
    currentLoad,
} from 'systeminformation';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version.js';
import { getters } from '@app/store/index.js';
import { ContainerState } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import {
    Devices,
    InfoApps,
    InfoCpu,
    InfoMemory,
    Os as InfoOs,
    MemoryLayout,
    Versions,
    CpuUtilization,
} from '@app/unraid-api/graph/resolvers/info/info.model.js';

@Injectable()
export class InfoService {
    constructor(private readonly dockerService: DockerService) {}

    async generateApps(): Promise<InfoApps> {
        const containers = await this.dockerService.getContainers({ skipCache: false });
        const installed = containers.length;
        const started = containers.filter(
            (container) => container.state === ContainerState.RUNNING
        ).length;

        return { id: 'info/apps', installed, started };
    }

    async generateOs(): Promise<InfoOs> {
        const os = await osInfo();

        return {
            id: 'info/os',
            ...os,
            hostname: getters.emhttp().var.name,
            uptime: bootTimestamp.toISOString(),
        };
    }

    async generateCpu(): Promise<InfoCpu> {
        const { cores, physicalCores, speedMin, speedMax, stepping, ...rest } = await cpu();
        const flags = await cpuFlags()
            .then((flags) => flags.split(' '))
            .catch(() => []);

        return {
            id: 'info/cpu',
            ...rest,
            cores: physicalCores,
            threads: cores,
            flags,
            stepping: Number(stepping),
            speedmin: speedMin || -1,
            speedmax: speedMax || -1,
        };
    }

    async generateVersions(): Promise<Versions> {
        const unraid = await getUnraidVersion();
        const softwareVersions = await versions();

        return {
            id: 'info/versions',
            unraid,
            ...softwareVersions,
        };
    }

    async generateMemory(): Promise<InfoMemory> {
        const layout = await memLayout()
            .then((dims) => dims.map((dim) => dim as MemoryLayout))
            .catch(() => []);
        const info = await mem();

        return {
            id: 'info/memory',
            layout,
            max: info.total,
            ...info,
        };
    }

    async generateDevices(): Promise<Devices> {
        return {
            id: 'info/devices',
            // These fields will be resolved by DevicesResolver
        } as Devices;
    }

    async generateCpuLoad(): Promise<CpuUtilization> {
        const { currentLoad: load, cpus } = await currentLoad();

        return {
            id: 'info/cpu-load',
            load,
            cpus,
        };
    }
}
