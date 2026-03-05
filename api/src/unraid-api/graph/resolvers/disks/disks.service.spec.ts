import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import type { Systeminformation } from 'systeminformation';
import type { MockedFunction } from 'vitest';
import { execa } from 'execa';
import { blockDevices, diskLayout } from 'systeminformation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ArrayDisk,
    ArrayDiskStatus,
    ArrayDiskType,
} from '@app/unraid-api/graph/resolvers/array/array.model.js';
import {
    Disk,
    DiskFsType,
    DiskInterfaceType,
    DiskSmartStatus,
} from '@app/unraid-api/graph/resolvers/disks/disks.model.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { batchProcess } from '@app/utils.js';

// Vitest imports

// Mock the external dependencies using vi
vi.mock('execa');
vi.mock('systeminformation');
vi.mock('@app/utils.js', () => ({
    batchProcess: vi.fn().mockImplementation(async (items, processor) => {
        const data = await Promise.all(items.map(processor));
        return { data, errors: [] };
    }),
}));

// Remove explicit type assertions for mocks
const mockExeca = execa as unknown as MockedFunction<typeof execa>;
const mockBlockDevices = blockDevices as unknown as MockedFunction<typeof blockDevices>;
const mockDiskLayout = diskLayout as unknown as MockedFunction<typeof diskLayout>;
const mockBatchProcess = batchProcess as unknown as MockedFunction<typeof batchProcess>;

describe('DisksService', () => {
    let service: DisksService;
    let configService: ConfigService;

    // Mock ArrayDisk data from state
    const mockArrayDisks: ArrayDisk[] = [
        {
            id: 'S4ENNF0N123456',
            device: 'sda',
            name: 'cache',
            size: 512110190592,
            idx: 30,
            type: ArrayDiskType.CACHE,
            status: ArrayDiskStatus.DISK_OK,
            isSpinning: null, // NVMe/SSD doesn't spin
            rotational: false,
            exportable: false,
            numErrors: 0,
            numReads: 1000,
            numWrites: 2000,
            temp: 42,
            comment: 'NVMe Cache',
            format: 'GPT: 4KiB-aligned',
            fsType: 'btrfs',
            transport: 'nvme',
            warning: null,
            critical: null,
            fsFree: null,
            fsSize: null,
            fsUsed: null,
        },
        {
            id: 'WD-WCC7K7YL9876',
            device: 'sdb',
            name: 'disk1',
            size: 4000787030016,
            idx: 1,
            type: ArrayDiskType.DATA,
            status: ArrayDiskStatus.DISK_OK,
            isSpinning: true, // Currently spinning
            rotational: true,
            exportable: false,
            numErrors: 0,
            numReads: 5000,
            numWrites: 3000,
            temp: 35,
            comment: 'Data Disk 1',
            format: 'GPT: 4KiB-aligned',
            fsType: 'xfs',
            transport: 'sata',
            warning: null,
            critical: null,
            fsFree: 1000000000,
            fsSize: 4000000000,
            fsUsed: 3000000000,
        },
        {
            id: 'WD-SPUNDOWN123',
            device: 'sdd',
            name: 'disk2',
            size: 4000787030016,
            idx: 2,
            type: ArrayDiskType.DATA,
            status: ArrayDiskStatus.DISK_OK,
            isSpinning: false, // Spun down
            rotational: true,
            exportable: false,
            numErrors: 0,
            numReads: 3000,
            numWrites: 1000,
            temp: 30,
            comment: 'Data Disk 2 (spun down)',
            format: 'GPT: 4KiB-aligned',
            fsType: 'xfs',
            transport: 'sata',
            warning: null,
            critical: null,
            fsFree: 2000000000,
            fsSize: 4000000000,
            fsUsed: 2000000000,
        },
    ];

    const mockDiskLayoutData: Systeminformation.DiskLayoutData[] = [
        {
            device: '/dev/sda',
            type: 'HD',
            name: 'SAMSUNG MZVLB512HBJQ-000L7',
            vendor: 'Samsung',
            size: 512110190592,
            bytesPerSector: 512,
            totalCylinders: 62260,
            totalHeads: 255,
            totalSectors: 1000215216,
            totalTracks: 15876300,
            tracksPerCylinder: 255,
            sectorsPerTrack: 63,
            firmwareRevision: 'EXF72L1Q',
            serialNum: 'S4ENNF0N123456',
            interfaceType: 'NVMe',
            smartStatus: 'Ok',
            temperature: null, // Systeminformation doesn't provide this directly
        },
        {
            device: '/dev/sdb',
            type: 'HD',
            name: 'WDC WD40EFRX-68N32N0',
            vendor: 'Western Digital',
            size: 4000787030016,
            bytesPerSector: 512,
            totalCylinders: 486401,
            totalHeads: 255,
            totalSectors: 7814037168,
            totalTracks: 124032255,
            tracksPerCylinder: 255,
            sectorsPerTrack: 63,
            firmwareRevision: '82.00A82',
            serialNum: 'WD-WCC7K7YL9876',
            interfaceType: 'SATA',
            smartStatus: 'Ok',
            temperature: null,
        },
        {
            device: '/dev/sdc', // Disk with unknown interface type
            type: 'HD',
            name: 'Some Other Disk',
            vendor: 'OtherVendor',
            size: 1000204886016,
            bytesPerSector: 512,
            totalCylinders: 121601,
            totalHeads: 255,
            totalSectors: 1953525168,
            totalTracks: 30908255,
            tracksPerCylinder: 255,
            sectorsPerTrack: 63,
            firmwareRevision: '1.0',
            serialNum: 'OTHER-SERIAL-123',
            interfaceType: '', // Simulate unknown type
            smartStatus: 'unknown', // Simulate unknown status
            temperature: null,
        },
        {
            device: '/dev/sdd',
            type: 'HD',
            name: 'WD Spun Down',
            vendor: 'Western Digital',
            size: 4000787030016,
            bytesPerSector: 512,
            totalCylinders: 486401,
            totalHeads: 255,
            totalSectors: 7814037168,
            totalTracks: 124032255,
            tracksPerCylinder: 255,
            sectorsPerTrack: 63,
            firmwareRevision: '82.00A82',
            serialNum: 'WD-SPUNDOWN123',
            interfaceType: 'SATA',
            smartStatus: 'Ok',
            temperature: null,
        },
    ];

    const mockBlockDeviceData: Systeminformation.BlockDevicesData[] = [
        // Partitions for sda
        {
            name: 'sda1',
            type: 'part',
            fsType: 'vfat',
            mount: '/boot/efi',
            size: 536870912,
            physical: 'SSD',
            uuid: 'UUID-SDA1',
            label: 'EFI',
            model: 'SAMSUNG MZVLB512HBJQ-000L7',
            serial: 'S4ENNF0N123456',
            removable: false,
            protocol: 'NVMe',
            identifier: '/dev/sda1',
        },
        {
            name: 'sda2',
            type: 'part',
            fsType: 'ext4',
            mount: '/',
            size: 511560000000, // Adjusted size
            physical: 'SSD',
            uuid: 'UUID-SDA2',
            label: 'root',
            model: 'SAMSUNG MZVLB512HBJQ-000L7',
            serial: 'S4ENNF0N123456',
            removable: false,
            protocol: 'NVMe',
            identifier: '/dev/sda2',
        },
        // Partitions for sdb
        {
            name: 'sdb1',
            type: 'part',
            fsType: 'xfs',
            mount: '/mnt/data',
            size: 4000787030016,
            physical: 'HDD',
            uuid: 'UUID-SDB1',
            label: 'Data',
            model: 'WDC WD40EFRX-68N32N0',
            serial: 'WD-WCC7K7YL9876',
            removable: false,
            protocol: 'SATA',
            identifier: '/dev/sdb1',
        },
        // Not a partition type, should be filtered out
        {
            name: 'loop0',
            type: 'loop',
            fsType: '',
            mount: '/snap/core/123',
            size: 100000000,
            physical: '',
            uuid: '',
            label: '',
            model: '',
            serial: '',
            removable: false,
            protocol: '',
            identifier: 'loop0',
        },
        // Partition for sdc
        {
            name: 'sdc1',
            type: 'part',
            fsType: 'ntfs', // Example different fs type
            mount: '/mnt/windows',
            size: 1000204886016,
            physical: 'HDD',
            uuid: 'UUID-SDC1',
            label: 'Windows',
            model: 'Some Other Disk',
            serial: 'OTHER-SERIAL-123',
            removable: false,
            protocol: 'SATA', // Assume SATA even if interface type unknown for disk
            identifier: '/dev/sdc1',
        },
        // Partition for sdd
        {
            name: 'sdd1',
            type: 'part',
            fsType: 'xfs',
            mount: '/mnt/disk2',
            size: 4000787030016,
            physical: 'HDD',
            uuid: 'UUID-SDD1',
            label: 'Data2',
            model: 'WD Spun Down',
            serial: 'WD-SPUNDOWN123',
            removable: false,
            protocol: 'SATA',
            identifier: '/dev/sdd1',
        },
    ];

    beforeEach(async () => {
        // Reset mocks before each test using vi
        vi.clearAllMocks();

        // Create mock ConfigService
        const mockConfigService = {
            get: vi.fn().mockImplementation((key: string, defaultValue?: unknown) => {
                if (key === 'store.emhttp.disks') {
                    return mockArrayDisks;
                }
                return defaultValue;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DisksService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<DisksService>(DisksService);
        configService = module.get<ConfigService>(ConfigService);

        // Setup default mock implementations
        mockDiskLayout.mockResolvedValue(mockDiskLayoutData);
        mockBlockDevices.mockResolvedValue(mockBlockDeviceData);
        mockExeca.mockResolvedValue({
            stdout: '',
            stderr: '',
            exitCode: 0,
            failed: false,
            command: '',
            cwd: '',
            isCanceled: false,
        } as unknown as Awaited<ReturnType<typeof execa>>); // Default successful execa
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // --- Test getDisks ---

    describe('getDisks', () => {
        it('should return disks with spinning state from store', async () => {
            const disks = await service.getDisks();

            expect(mockDiskLayout).toHaveBeenCalledTimes(1);
            expect(mockBlockDevices).toHaveBeenCalledTimes(1);
            expect(configService.get).toHaveBeenCalledWith('store.emhttp.disks', []);
            expect(mockBatchProcess).toHaveBeenCalledTimes(1);

            expect(disks).toHaveLength(mockDiskLayoutData.length);

            // Check NVMe disk with null spinning state
            const nvmeDisk = disks.find((d) => d.id === 'S4ENNF0N123456');
            expect(nvmeDisk).toBeDefined();
            expect(nvmeDisk?.isSpinning).toBe(false); // null from state defaults to false
            expect(nvmeDisk?.interfaceType).toBe(DiskInterfaceType.PCIE);
            expect(nvmeDisk?.smartStatus).toBe(DiskSmartStatus.OK);
            expect(nvmeDisk?.partitions).toHaveLength(2);

            // Check spinning disk
            const spinningDisk = disks.find((d) => d.id === 'WD-WCC7K7YL9876');
            expect(spinningDisk).toBeDefined();
            expect(spinningDisk?.isSpinning).toBe(true); // From state
            expect(spinningDisk?.interfaceType).toBe(DiskInterfaceType.SATA);

            // Check spun down disk
            const spunDownDisk = disks.find((d) => d.id === 'WD-SPUNDOWN123');
            expect(spunDownDisk).toBeDefined();
            expect(spunDownDisk?.isSpinning).toBe(false); // From state

            // Check disk not in state (defaults to not spinning)
            const unknownDisk = disks.find((d) => d.id === 'OTHER-SERIAL-123');
            expect(unknownDisk).toBeDefined();
            expect(unknownDisk?.isSpinning).toBe(false); // Not in state, defaults to false
            expect(unknownDisk?.interfaceType).toBe(DiskInterfaceType.UNKNOWN);
            expect(unknownDisk?.smartStatus).toBe(DiskSmartStatus.UNKNOWN);
        });

        it('should handle empty state gracefully', async () => {
            vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: unknown) => {
                if (key === 'store.emhttp.disks') {
                    return [];
                }
                return defaultValue;
            });

            const disks = await service.getDisks();

            // All disks should default to not spinning when state is empty
            expect(disks).toHaveLength(mockDiskLayoutData.length);
            disks.forEach((disk) => {
                expect(disk.isSpinning).toBe(false);
            });
        });

        it('should handle trimmed serial numbers correctly', async () => {
            // Add disk with spaces in ID
            const disksWithSpaces = [...mockArrayDisks];
            disksWithSpaces[0] = {
                ...disksWithSpaces[0],
                id: '  S4ENNF0N123456  ', // spaces around ID
            };

            vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: any) => {
                if (key === 'store.emhttp.disks') {
                    return disksWithSpaces;
                }
                return defaultValue;
            });

            const disks = await service.getDisks();
            const disk = disks.find((d) => d.id === 'S4ENNF0N123456');

            expect(disk).toBeDefined();
            expect(disk?.isSpinning).toBe(false); // null becomes false
        });

        it('should correctly map partitions to disks', async () => {
            const disks = await service.getDisks();

            const disk1 = disks.find((d) => d.id === 'S4ENNF0N123456');
            expect(disk1?.partitions).toHaveLength(2);
            expect(disk1?.partitions[0]).toEqual({
                name: 'sda1',
                fsType: DiskFsType.VFAT,
                size: 536870912,
            });
            expect(disk1?.partitions[1]).toEqual({
                name: 'sda2',
                fsType: DiskFsType.EXT4,
                size: 511560000000,
            });

            const disk2 = disks.find((d) => d.id === 'WD-WCC7K7YL9876');
            expect(disk2?.partitions).toHaveLength(1);
            expect(disk2?.partitions[0]).toEqual({
                name: 'sdb1',
                fsType: DiskFsType.XFS,
                size: 4000787030016,
            });
        });

        it('should use ConfigService to get state data', async () => {
            await service.getDisks();

            // Verify we're accessing the state through ConfigService
            expect(configService.get).toHaveBeenCalledWith('store.emhttp.disks', []);
        });

        it('should handle empty disk layout or block devices', async () => {
            mockDiskLayout.mockResolvedValue([]);
            mockBlockDevices.mockResolvedValue([]);

            const disks = await service.getDisks();
            expect(disks).toEqual([]);
            expect(mockBatchProcess).toHaveBeenCalledWith([], expect.any(Function));

            mockDiskLayout.mockResolvedValue(mockDiskLayoutData); // Restore for next check
            mockBlockDevices.mockResolvedValue([]);
            const disks2 = await service.getDisks();
            expect(disks2).toHaveLength(mockDiskLayoutData.length);
            expect(disks2[0].partitions).toEqual([]);
            expect(disks2[1].partitions).toEqual([]);
            expect(disks2[2].partitions).toEqual([]);
        });
    });

    // --- Test getDisk ---
    describe('getDisk', () => {
        it('should return a specific disk by id', async () => {
            const disk = await service.getDisk('S4ENNF0N123456');

            expect(disk).toBeDefined();
            expect(disk.id).toBe('S4ENNF0N123456');
            expect(disk.isSpinning).toBe(false); // null becomes false
        });

        it('should return spinning disk correctly', async () => {
            const disk = await service.getDisk('WD-WCC7K7YL9876');

            expect(disk).toBeDefined();
            expect(disk.id).toBe('WD-WCC7K7YL9876');
            expect(disk.isSpinning).toBe(true);
        });

        it('should throw NotFoundException for non-existent disk', async () => {
            await expect(service.getDisk('NONEXISTENT')).rejects.toThrow(
                'Disk with id NONEXISTENT not found'
            );
        });
    });

    // --- Test getTemperature ---
    describe('getTemperature', () => {
        it('should return temperature for a disk', async () => {
            mockExeca.mockResolvedValue({
                stdout: JSON.stringify({
                    temperature: { current: 42 },
                    ata_smart_attributes: {
                        table: [
                            {
                                id: 194,
                                name: 'Temperature_Celsius',
                                flags: { string: '0x0022', value: 34 },
                                value: 114,
                                worst: 91,
                                thresh: 0,
                                when_failed: '',
                                raw: { value: 42, string: '42' },
                            },
                        ],
                    },
                }),
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            } as unknown as Awaited<ReturnType<typeof execa>>);
            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBe(42);
            expect(mockExeca).toHaveBeenCalledWith('smartctl', [
                '-n',
                'standby',
                '-A',
                '-j',
                '/dev/sda',
            ]);
        });

        it('should handle case where smartctl output has no temperature field', async () => {
            mockExeca.mockResolvedValue({
                stdout: JSON.stringify({
                    ata_smart_attributes: {
                        table: [
                            {
                                id: 1,
                                name: 'Raw_Read_Error_Rate',
                                flags: { string: '0x002f', value: 47 },
                                value: 200,
                                worst: 200,
                                thresh: 51,
                                when_failed: '',
                                raw: { value: 0, string: '0' },
                            },
                        ],
                    },
                }),
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            } as unknown as Awaited<ReturnType<typeof execa>>);
            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBeNull();
        });

        it('should handle case where smartctl output has Temperature_Celsius with Min/Max format', async () => {
            mockExeca.mockResolvedValue({
                stdout: JSON.stringify({
                    ata_smart_attributes: {
                        table: [
                            {
                                id: 194,
                                name: 'Temperature_Celsius',
                                flags: { string: '0x0022', value: 34 },
                                value: 70,
                                worst: 60,
                                thresh: 0,
                                when_failed: '',
                                raw: { value: 30, string: '30 (Min/Max 25/45)' },
                            },
                        ],
                    },
                }),
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            } as unknown as Awaited<ReturnType<typeof execa>>);
            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBe(30);
        });

        it('should handle case where smartctl output has Airflow_Temperature_Cel', async () => {
            mockExeca.mockResolvedValue({
                stdout: JSON.stringify({
                    ata_smart_attributes: {
                        table: [
                            {
                                id: 190,
                                name: 'Airflow_Temperature_Cel',
                                flags: { string: '0x0022', value: 34 },
                                value: 65,
                                worst: 58,
                                thresh: 45,
                                when_failed: '',
                                raw: { value: 35, string: '35 (Min/Max 30/42 #123)' },
                            },
                        ],
                    },
                }),
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            } as unknown as Awaited<ReturnType<typeof execa>>);
            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBe(35);
        });

        it('should handle errors during temperature fetching gracefully', async () => {
            mockExeca.mockRejectedValue(new Error('smartctl command failed'));

            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBeNull();
        });

        it('should return 0 when temperature is 0 degrees', async () => {
            mockExeca.mockResolvedValue({
                stdout: JSON.stringify({
                    temperature: { current: 0 },
                }),
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            } as unknown as Awaited<ReturnType<typeof execa>>);
            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBe(0);
        });

        it('should return null when temperature is null or undefined', async () => {
            mockExeca.mockResolvedValue({
                stdout: JSON.stringify({
                    temperature: { current: null },
                }),
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            } as unknown as Awaited<ReturnType<typeof execa>>);
            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBeNull();

            mockExeca.mockResolvedValue({
                stdout: JSON.stringify({
                    temperature: {},
                }),
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            } as unknown as Awaited<ReturnType<typeof execa>>);
            const temperature2 = await service.getTemperature('/dev/sda');
            expect(temperature2).toBeNull();
        });
    });
});
