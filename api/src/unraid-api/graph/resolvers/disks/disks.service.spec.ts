import { Test, TestingModule } from '@nestjs/testing';

import type { Systeminformation } from 'systeminformation';
import { execa } from 'execa';
import { blockDevices, diskLayout } from 'systeminformation';
// Vitest imports
import { beforeEach, describe, expect, it, Mock, MockedFunction, vi } from 'vitest';

import type { Disk } from '@app/graphql/generated/api/types.js';
import { DiskFsType, DiskInterfaceType, DiskSmartStatus } from '@app/graphql/generated/api/types.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { batchProcess } from '@app/utils.js';

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
const mockExeca = execa as any; // Using 'any' for simplicity with complex mock setups
const mockBlockDevices = blockDevices as any;
const mockDiskLayout = diskLayout as any;
const mockBatchProcess = batchProcess as any;

describe('DisksService', () => {
    let service: DisksService;

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
    ];

    beforeEach(async () => {
        // Reset mocks before each test using vi
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [DisksService],
        }).compile();

        service = module.get<DisksService>(DisksService);

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
        }); // Default successful execa
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // --- Test getDisks ---

    describe('getDisks', () => {
        it('should return disks without temperature', async () => {
            const disks = await service.getDisks();

            expect(mockDiskLayout).toHaveBeenCalledTimes(1);
            expect(mockBlockDevices).toHaveBeenCalledTimes(1);
            expect(mockExeca).not.toHaveBeenCalled(); // Temperature should not be fetched
            expect(mockBatchProcess).toHaveBeenCalledTimes(1); // Still uses batchProcess for parsing

            expect(disks).toHaveLength(mockDiskLayoutData.length);
            expect(disks[0]).toMatchObject({
                id: 'S4ENNF0N123456',
                device: '/dev/sda',
                type: 'HD',
                name: 'SAMSUNG MZVLB512HBJQ-000L7',
                vendor: 'Samsung',
                size: 512110190592,
                interfaceType: DiskInterfaceType.PCIE,
                smartStatus: DiskSmartStatus.OK,
                temperature: null, // Temperature is now null by default
                partitions: [
                    { name: 'sda1', fsType: DiskFsType.VFAT, size: 536870912 },
                    { name: 'sda2', fsType: DiskFsType.EXT4, size: 511560000000 },
                ],
            });
            expect(disks[1]).toMatchObject({
                id: 'WD-WCC7K7YL9876',
                device: '/dev/sdb',
                interfaceType: DiskInterfaceType.SATA,
                smartStatus: DiskSmartStatus.OK,
                temperature: null,
                partitions: [{ name: 'sdb1', fsType: DiskFsType.XFS, size: 4000787030016 }],
            });
            expect(disks[2]).toMatchObject({
                id: 'OTHER-SERIAL-123',
                device: '/dev/sdc',
                interfaceType: DiskInterfaceType.UNKNOWN,
                smartStatus: DiskSmartStatus.UNKNOWN,
                temperature: null,
                partitions: [{ name: 'sdc1', fsType: DiskFsType.NTFS, size: 1000204886016 }],
            });
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

    // --- Test getTemperature ---
    describe('getTemperature', () => {
        it('should return temperature for a disk', async () => {
            mockExeca.mockResolvedValue({
                stdout: `ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
194 Temperature_Celsius     0x0022   114   091   000    Old_age   Always       -       42`,
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            });

            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBe(42);
            expect(mockExeca).toHaveBeenCalledWith('smartctl', ['-A', '/dev/sda']);
        });

        it('should handle case where smartctl output has no temperature field', async () => {
            mockExeca.mockResolvedValue({
                stdout: 'ID# ATTRIBUTE_NAME\n1 Some_Attribute 100 100 000 Old_age Always - 0',
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            }); // No temp line

            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBeNull();
        });

        it('should handle case where smartctl output has Temperature_Celsius with Min/Max format', async () => {
            mockExeca.mockResolvedValue({
                stdout: `ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
194 Temperature_Celsius     0x0022   070   060   000    Old_age   Always       -       30 (Min/Max 25/45)`,
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            });

            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBe(30);
        });

        it('should handle case where smartctl output has Airflow_Temperature_Cel', async () => {
            mockExeca.mockResolvedValue({
                stdout: `ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
190 Airflow_Temperature_Cel 0x0022   065   058   045    Old_age   Always       -       35  (Min/Max 30/42 #123)`,
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            });

            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBe(35);
        });

        it('should handle errors during temperature fetching gracefully', async () => {
            mockExeca.mockRejectedValue(new Error('smartctl command failed'));

            const temperature = await service.getTemperature('/dev/sda');
            expect(temperature).toBeNull();
        });
    });
});
