import { Injectable } from '@nestjs/common';

import { cpu, cpuFlags, currentLoad } from 'systeminformation';

import { CpuUtilization, InfoCpu } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';

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
        const loadData = await currentLoad();

        return {
            id: 'info/cpu-load',
            percentTotal: Math.floor(loadData.currentLoad),
            cpus: loadData.cpus.map((cpu) => ({
                percentTotal: Math.floor(cpu.load),
                percentUser: Math.floor(cpu.loadUser),
                percentSystem: Math.floor(cpu.loadSystem),
                percentNice: Math.floor(cpu.loadNice),
                percentIdle: Math.floor(cpu.loadIdle),
                percentIrq: Math.floor(cpu.loadIrq),
                percentGuest: Math.floor(cpu.loadGuest || 0),
                percentSteal: Math.floor(cpu.loadSteal || 0),
            })),
        };
    }
}
