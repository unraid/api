import { Injectable, Scope } from '@nestjs/common';

import { cpu, cpuFlags, currentLoad, Systeminformation } from 'systeminformation';

import { CpuUtilization, InfoCpu } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';

@Injectable({ scope: Scope.REQUEST })
export class CpuDataService {
    private cpuLoadData: Promise<Systeminformation.CurrentLoadData> | undefined;

    public getCpuLoad(): Promise<Systeminformation.CurrentLoadData> {
        this.cpuLoadData ??= currentLoad();
        return this.cpuLoadData;
    }
}

@Injectable()
export class CpuService {
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

    async generateCpuLoad(): Promise<CpuUtilization> {
        const { currentLoad: load, cpus } = await currentLoad();

        return {
            id: 'info/cpu-load',
            load,
            cpus,
        };
    }
}
