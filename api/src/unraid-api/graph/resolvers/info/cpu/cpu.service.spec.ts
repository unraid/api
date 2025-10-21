import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';

vi.mock('systeminformation', () => ({
    cpu: vi.fn().mockResolvedValue({
        manufacturer: 'Intel',
        brand: 'Core i7-9700K',
        vendor: 'Intel',
        family: '6',
        model: '158',
        stepping: '12',
        revision: '',
        voltage: '1.2V',
        speed: 3.6,
        speedMin: 800,
        speedMax: 4900,
        cores: 16,
        physicalCores: 8,
        processors: 1,
        socket: 'LGA1151',
        cache: {
            l1d: 32768,
            l1i: 32768,
            l2: 262144,
            l3: 12582912,
        },
    }),
    cpuFlags: vi.fn().mockResolvedValue('fpu vme de pse tsc msr pae mce cx8'),
    currentLoad: vi.fn().mockResolvedValue({
        avgLoad: 2.5,
        currentLoad: 25.5,
        currentLoadUser: 15.0,
        currentLoadSystem: 8.0,
        currentLoadNice: 0.5,
        currentLoadIdle: 74.5,
        currentLoadIrq: 1.0,
        currentLoadSteal: 0.2,
        currentLoadGuest: 0.3,
        rawCurrentLoad: 25500,
        rawCurrentLoadUser: 15000,
        rawCurrentLoadSystem: 8000,
        rawCurrentLoadNice: 500,
        rawCurrentLoadIdle: 74500,
        rawCurrentLoadIrq: 1000,
        rawCurrentLoadSteal: 200,
        rawCurrentLoadGuest: 300,
        cpus: [
            {
                load: 30.0,
                loadUser: 20.0,
                loadSystem: 10.0,
                loadNice: 0,
                loadIdle: 70.0,
                loadIrq: 0,
                loadSteal: 0,
                loadGuest: 0,
                rawLoad: 30000,
                rawLoadUser: 20000,
                rawLoadSystem: 10000,
                rawLoadNice: 0,
                rawLoadIdle: 70000,
                rawLoadIrq: 0,
                rawLoadSteal: 0,
                rawLoadGuest: 0,
            },
            {
                load: 21.0,
                loadUser: 15.0,
                loadSystem: 6.0,
                loadNice: 0,
                loadIdle: 79.0,
                loadIrq: 0,
                loadSteal: 0,
                loadGuest: 0,
                rawLoad: 21000,
                rawLoadUser: 15000,
                rawLoadSystem: 6000,
                rawLoadNice: 0,
                rawLoadIdle: 79000,
                rawLoadIrq: 0,
                rawLoadSteal: 0,
                rawLoadGuest: 0,
            },
        ],
    }),
}));

describe('CpuService', () => {
    let service: CpuService;
    let cpuTopologyService: CpuTopologyService;

    beforeEach(() => {
        cpuTopologyService = {
            generateTopology: vi.fn().mockResolvedValue([
                [
                    [0, 1],
                    [2, 3],
                ],
                [
                    [4, 5],
                    [6, 7],
                ],
            ]),
            generateTelemetry: vi.fn().mockResolvedValue([
                { power: 32.5, temp: 45.0 },
                { power: 33.0, temp: 46.0 },
            ]),
        } as any;

        service = new CpuService(cpuTopologyService);
    });

    describe('generateCpu', () => {
        it('should return CPU information with correct structure', async () => {
            const result = await service.generateCpu();

            expect(result).toEqual({
                id: 'info/cpu',
                manufacturer: 'Intel',
                brand: 'Core i7-9700K',
                vendor: 'Intel',
                family: '6',
                model: '158',
                stepping: 12,
                revision: '',
                voltage: '1.2V',
                speed: 3.6,
                speedmin: 800,
                speedmax: 4900,
                cores: 8,
                threads: 16,
                processors: 1,
                socket: 'LGA1151',
                cache: {
                    l1d: 32768,
                    l1i: 32768,
                    l2: 262144,
                    l3: 12582912,
                },
                flags: ['fpu', 'vme', 'de', 'pse', 'tsc', 'msr', 'pae', 'mce', 'cx8'],
                packages: {
                    totalPower: 65.5,
                    power: [32.5, 33.0],
                    temp: [45.0, 46.0],
                },
                topology: [
                    [
                        [0, 1],
                        [2, 3],
                    ],
                    [
                        [4, 5],
                        [6, 7],
                    ],
                ],
            });
        });

        it('should handle missing speed values', async () => {
            const { cpu } = await import('systeminformation');
            vi.mocked(cpu).mockResolvedValueOnce({
                manufacturer: 'Intel',
                brand: 'Core i7-9700K',
                vendor: 'Intel',
                family: '6',
                model: '158',
                stepping: '12',
                revision: '',
                voltage: '1.2V',
                speed: 3.6,
                cores: 16,
                physicalCores: 8,
                processors: 1,
                socket: 'LGA1151',
                cache: { l1d: 32768, l1i: 32768, l2: 262144, l3: 12582912 },
            } as any);

            const result = await service.generateCpu();

            expect(result.speedmin).toBe(-1);
            expect(result.speedmax).toBe(-1);
        });

        it('should handle cpuFlags error gracefully', async () => {
            const { cpuFlags } = await import('systeminformation');
            vi.mocked(cpuFlags).mockRejectedValueOnce(new Error('flags error'));

            const result = await service.generateCpu();

            expect(result.flags).toEqual([]);
        });
    });

    describe('generateCpuLoad', () => {
        it('should return CPU utilization with all load metrics', async () => {
            const result = await service.generateCpuLoad();

            expect(result).toEqual({
                id: 'info/cpu-load',
                percentTotal: 25.5,
                cpus: [
                    {
                        percentTotal: 30.0,
                        percentUser: 20.0,
                        percentSystem: 10.0,
                        percentNice: 0,
                        percentIdle: 70.0,
                        percentIrq: 0,
                        percentGuest: 0,
                        percentSteal: 0,
                    },
                    {
                        percentTotal: 21.0,
                        percentUser: 15.0,
                        percentSystem: 6.0,
                        percentNice: 0,
                        percentIdle: 79.0,
                        percentIrq: 0,
                        percentGuest: 0,
                        percentSteal: 0,
                    },
                ],
            });
        });

        it('should include guest and steal metrics when present', async () => {
            const { currentLoad } = await import('systeminformation');
            vi.mocked(currentLoad).mockResolvedValueOnce({
                avgLoad: 2.5,
                currentLoad: 25.5,
                currentLoadUser: 15.0,
                currentLoadSystem: 8.0,
                currentLoadNice: 0.5,
                currentLoadIdle: 74.5,
                currentLoadIrq: 1.0,
                currentLoadSteal: 0.2,
                currentLoadGuest: 0.3,
                rawCurrentLoad: 25500,
                rawCurrentLoadUser: 15000,
                rawCurrentLoadSystem: 8000,
                rawCurrentLoadNice: 500,
                rawCurrentLoadIdle: 74500,
                rawCurrentLoadIrq: 1000,
                rawCurrentLoadSteal: 200,
                rawCurrentLoadGuest: 300,
                cpus: [
                    {
                        load: 30.0,
                        loadUser: 20.0,
                        loadSystem: 10.0,
                        loadNice: 0,
                        loadIdle: 70.0,
                        loadIrq: 0,
                        loadGuest: 2.5,
                        loadSteal: 1.2,
                        rawLoad: 30000,
                        rawLoadUser: 20000,
                        rawLoadSystem: 10000,
                        rawLoadNice: 0,
                        rawLoadIdle: 70000,
                        rawLoadIrq: 0,
                        rawLoadGuest: 2500,
                        rawLoadSteal: 1200,
                    },
                ],
            });

            const result = await service.generateCpuLoad();

            expect(result.cpus[0]).toEqual(
                expect.objectContaining({
                    percentGuest: 2.5,
                    percentSteal: 1.2,
                })
            );
        });
    });
});
