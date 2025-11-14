import { Injectable } from '@nestjs/common';

import { cpu, cpuFlags, currentLoad } from 'systeminformation';

import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import {
    CpuPackages,
    CpuUtilization,
    InfoCpu,
} from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';

@Injectable()
export class CpuService {
    constructor(private readonly cpuTopologyService: CpuTopologyService) {}

    async generateCpu(): Promise<InfoCpu> {
        const { cores, physicalCores, speedMin, speedMax, stepping, processors, ...rest } = await cpu();
        const flags = await cpuFlags()
            .then((f) => f.split(' '))
            .catch(() => []);

        // Gather telemetry
        const packageList = await this.cpuTopologyService.generateTelemetry();
        const topology = await this.cpuTopologyService.generateTopology();

        // Compute total power (2 decimals)
        const totalPower = Number(
            packageList
                .map((pkg) => pkg.power)
                .filter((power) => power >= 0)
                .reduce((sum, power) => sum + power, 0)
                .toFixed(2)
        );

        // Build CpuPackages object
        const packages: CpuPackages = {
            id: 'info/cpu/packages',
            totalPower,
            power: packageList.map((pkg) => pkg.power ?? -1),
            temp: packageList.map((pkg) => pkg.temp ?? -1),
        };

        return {
            id: 'info/cpu',
            ...rest,
            cores: physicalCores,
            threads: cores,
            processors,
            flags,
            stepping: Number(stepping),
            speedmin: speedMin || -1,
            speedmax: speedMax || -1,
            packages,
            topology,
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
