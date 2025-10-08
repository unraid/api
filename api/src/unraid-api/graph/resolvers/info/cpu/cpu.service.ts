import { Injectable, Logger } from '@nestjs/common';
import { constants as fsConstants } from 'node:fs';
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { cpu, cpuFlags, currentLoad } from 'systeminformation';

import { CpuPowerService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-power.service.js';
import { CpuUtilization, InfoCpu } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';

@Injectable()
export class CpuService {
    private readonly logger = new Logger(CpuService.name);

    constructor(private readonly cpuPowerService: CpuPowerService) {}

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
            power: await this.cpuPowerService.generateCpuPower(),
            stepping: Number(stepping),
            speedmin: speedMin || -1,
            speedmax: speedMax || -1,
        };
    }

    async generateCpuLoad(): Promise<CpuUtilization> {
        const loadData = await currentLoad();

        return {
            id: 'info/cpu-load',
            percentTotal: loadData.currentLoad,
            cpus: loadData.cpus.map((cpu) => ({
                percentTotal: cpu.load,
                percentUser: cpu.loadUser,
                percentSystem: cpu.loadSystem,
                percentNice: cpu.loadNice,
                percentIdle: cpu.loadIdle,
                percentIrq: cpu.loadIrq,
                percentGuest: cpu.loadGuest || 0,
                percentSteal: cpu.loadSteal || 0,
            })),
        };
    }
}
