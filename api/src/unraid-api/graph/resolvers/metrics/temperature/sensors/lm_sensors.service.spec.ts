import { execa } from 'execa';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LmSensorsService } from '@app/unraid-api/graph/resolvers/metrics/temperature/sensors/lm_sensors.service.js';
import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import {
    SensorType,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

// Mock execa
vi.mock('execa', async (importOriginal) => {
    const mod = await importOriginal<typeof import('execa')>();
    return {
        ...mod,
        execa: vi.fn(),
    };
});

describe('LmSensorsService', () => {
    let service: LmSensorsService;
    let configService: TemperatureConfigService;

    beforeEach(() => {
        configService = {
            getConfig: vi.fn().mockReturnValue({
                sensors: {
                    lm_sensors: {
                        config_path: undefined,
                    },
                },
            }),
        } as unknown as TemperatureConfigService;

        service = new LmSensorsService(configService);
        vi.clearAllMocks();
    });

    describe('isAvailable', () => {
        it('should return true when sensors command exists', async () => {
            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: 'sensors version 3.6.0' });

            const available = await service.isAvailable();

            expect(available).toBe(true);
            expect(execa).toHaveBeenCalledWith(
                'sensors',
                ['--version'],
                expect.objectContaining({ timeout: 3000 })
            );
        });

        it('should return false when sensors command not found', async () => {
            vi.mocked(execa).mockRejectedValue(new Error('Command not found'));

            const available = await service.isAvailable();

            expect(available).toBe(false);
        });
    });

    describe('read', () => {
        it('should use default arguments when no config path is set', async () => {
            // Mock config returning undefined (already set in beforeEach)
            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: '{}' });

            await service.read();

            // Verify called with defaults
            expect(execa).toHaveBeenCalledWith(
                'sensors',
                ['-j'],
                expect.objectContaining({ timeout: 3000 })
            );
        });

        it('should add -c flag when config path is present', async () => {
            // Mock config returning a path
            vi.mocked(configService.getConfig).mockReturnValue({
                sensors: {
                    lm_sensors: {
                        config_path: '/etc/my-sensors.conf',
                    },
                },
            });
            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: '{}' });

            await service.read();

            // Verify called with extra args
            expect(execa).toHaveBeenCalledWith(
                'sensors',
                ['-j', '-c', '/etc/my-sensors.conf'],
                expect.objectContaining({ timeout: 3000 })
            );
        });

        it('should parse sensors JSON output correctly', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'Package id 0': {
                        temp1_input: 55.0,
                    },
                    'Core 0': {
                        temp2_input: 52.0,
                    },
                    'Core 1': {
                        temp3_input: 54.0,
                    },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors).toHaveLength(3);
            expect(sensors[0]).toEqual({
                id: 'coretemp-isa-0000:Package id 0:temp1_input',
                name: 'coretemp-isa-0000 Package id 0',
                type: SensorType.CPU_PACKAGE,
                value: 55.0,
                unit: TemperatureUnit.CELSIUS,
            });
        });

        it('should handle multiple chips', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'Core 0': { temp1_input: 50.0 },
                },
                'nvme-pci-0100': {
                    Adapter: 'PCI adapter',
                    Composite: { temp1_input: 40.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors).toHaveLength(2);
        });

        it('should skip Adapter field', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'Core 0': { temp1_input: 50.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors.find((s) => s.name.includes('Adapter'))).toBeUndefined();
        });

        it('should only process _input fields', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'Core 0': {
                        temp1_input: 50.0,
                        temp1_max: 100.0,
                        temp1_crit: 105.0,
                    },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].value).toBe(50.0);
        });

        it('should handle malformed JSON', async () => {
            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: 'not valid json' });

            await expect(service.read()).rejects.toThrow();
        });

        it('should handle empty output', async () => {
            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: '{}' });

            const sensors = await service.read();

            expect(sensors).toEqual([]);
        });

        it('should handle non-object values in chip data', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'some-string-value': 'not an object',
                    'some-number-value': 123,
                    'Core 0': { temp1_input: 50.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].name).toContain('Core 0');
        });

        it('should handle non-number temperature values', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'Core 0': {
                        temp1_input: 'not a number',
                    },
                    'Core 1': {
                        temp1_input: 50.0,
                    },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors).toHaveLength(1);
            expect(sensors[0].name).toContain('Core 1');
        });
    });

    describe('inferType', () => {
        it('should return CPU_PACKAGE for package sensors', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'Package id 0': { temp1_input: 55.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.CPU_PACKAGE);
        });

        it('should return CPU_CORE for core sensors', async () => {
            const mockOutput = {
                'coretemp-isa-0000': {
                    Adapter: 'ISA adapter',
                    'Core 0': { temp1_input: 50.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.CPU_CORE);
        });

        it('should return NVME for nvme sensors', async () => {
            const mockOutput = {
                'nvme-pci-0100': {
                    Adapter: 'PCI adapter',
                    Composite: { temp1_input: 40.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.NVME);
        });

        it('should return GPU for gpu sensors', async () => {
            const mockOutput = {
                'amdgpu-pci-0800': {
                    Adapter: 'PCI adapter',
                    'GPU temp': { temp1_input: 65.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.GPU);
        });

        it('should return MOTHERBOARD for wmi sensors', async () => {
            const mockOutput = {
                'asus-wmi-sensors': {
                    Adapter: 'Virtual device',
                    'CPU Temperature': { temp1_input: 45.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.MOTHERBOARD);
        });

        it('should return CUSTOM for unknown sensor types', async () => {
            const mockOutput = {
                'unknown-device-0000': {
                    Adapter: 'Some adapter',
                    'Random Sensor': { temp1_input: 30.0 },
                },
            };

            // @ts-expect-error -- mocking partial execa result
            vi.mocked(execa).mockResolvedValue({ stdout: JSON.stringify(mockOutput) });

            const sensors = await service.read();

            expect(sensors[0].type).toBe(SensorType.CUSTOM);
        });
    });

    describe('error handling', () => {
        it('should throw when execa fails', async () => {
            vi.mocked(execa).mockRejectedValue(new Error('sensors command failed'));

            await expect(service.read()).rejects.toThrow('sensors command failed');
        });
    });
});
