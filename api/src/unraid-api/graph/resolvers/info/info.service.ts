import { Injectable } from '@nestjs/common';

import toBytes from 'bytes';
import { execa } from 'execa';
import { cpu, cpuFlags, mem, memLayout, osInfo, versions } from 'systeminformation';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version.js';
import { AppError } from '@app/core/errors/app-error.js';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout.js';
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
        let max = info.total;

        try {
            const memoryInfo = await execa('dmidecode', ['-t', '16'])
                .then(cleanStdout)
                .catch((error: NodeJS.ErrnoException) => {
                    if (error.code === 'ENOENT') {
                        throw new AppError('The dmidecode cli utility is missing.');
                    }

                    throw error;
                });

            const capacityLine = memoryInfo
                .split('\n')
                .find((line) => line.trim().startsWith('Maximum Capacity'));

            if (capacityLine) {
                const capacityValue = capacityLine.trim().split(': ')[1];
                max = toBytes(capacityValue) ?? info.total;
            }
        } catch {
            // Ignore errors here
        }

        return {
            id: 'info/memory',
            layout,
            max,
            ...info,
        };
    }

    async generateDevices(): Promise<Devices> {
        return {
            id: 'info/devices',
            // These fields will be resolved by DevicesResolver
            gpu: [],
            pci: [],
            usb: [],
        };
    }
}
