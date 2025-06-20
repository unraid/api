import { Injectable } from '@nestjs/common';

import toBytes from 'bytes';
import { execa } from 'execa';
import { cpu, cpuFlags, mem, memLayout, osInfo, versions } from 'systeminformation';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version.js';
import { AppError } from '@app/core/errors/app-error.js';
import { type DynamixConfig } from '@app/core/types/ini.js';
import { toBoolean } from '@app/core/utils/casting.js';
import { docker } from '@app/core/utils/clients/docker.js';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout.js';
import { loadState } from '@app/core/utils/misc/load-state.js';
import { getters } from '@app/store/index.js';
import { ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import {
    Devices,
    Display,
    InfoApps,
    InfoCpu,
    InfoMemory,
    Os as InfoOs,
    MemoryLayout,
    Temperature,
    Versions,
} from '@app/unraid-api/graph/resolvers/info/info.model.js';

@Injectable()
export class InfoService {
    async generateApps(): Promise<InfoApps> {
        const installed = await docker
            .listContainers({ all: true })
            .catch(() => [])
            .then((containers) => containers.length);
        const started = await docker
            .listContainers()
            .catch(() => [])
            .then((containers) => containers.length);
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

    async generateDisplay(): Promise<Display> {
        const filePaths = getters.paths()['dynamix-config'];

        const state = filePaths.reduce<Partial<DynamixConfig>>(
            (acc, filePath) => {
                const state = loadState<DynamixConfig>(filePath);
                return state ? { ...acc, ...state } : acc;
            },
            {
                id: 'dynamix-config/display',
            }
        );

        if (!state.display) {
            return {
                id: 'dynamix-config/display',
            };
        }
        const { theme, unit, ...display } = state.display;
        return {
            id: 'dynamix-config/display',
            ...display,
            theme: theme as ThemeName,
            unit: unit as Temperature,
            scale: toBoolean(display.scale),
            tabs: toBoolean(display.tabs),
            resize: toBoolean(display.resize),
            wwn: toBoolean(display.wwn),
            total: toBoolean(display.total),
            usage: toBoolean(display.usage),
            text: toBoolean(display.text),
            warning: Number.parseInt(display.warning, 10),
            critical: Number.parseInt(display.critical, 10),
            hot: Number.parseInt(display.hot, 10),
            max: Number.parseInt(display.max, 10),
            locale: display.locale || 'en_US',
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
