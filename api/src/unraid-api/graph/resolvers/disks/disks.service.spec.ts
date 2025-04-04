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
        it('should return disks without temperature when options.temperature is false', async () => {
            const disks = await service.getDisks({ temperature: false });

            expect(mockDiskLayout).toHaveBeenCalledTimes(1);
            expect(mockBlockDevices).toHaveBeenCalledTimes(1);
            expect(mockExeca).not.toHaveBeenCalled(); // Temperature should not be fetched
            expect(mockBatchProcess).not.toHaveBeenCalled(); // Should not use batchProcess if temp is false

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
                temperature: -1, // Expect default -1 when not fetched
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
                temperature: -1,
                partitions: [{ name: 'sdb1', fsType: DiskFsType.XFS, size: 4000787030016 }],
            });
            expect(disks[2]).toMatchObject({
                id: 'OTHER-SERIAL-123',
                device: '/dev/sdc',
                interfaceType: DiskInterfaceType.UNKNOWN,
                smartStatus: DiskSmartStatus.UNKNOWN,
                temperature: -1,
                partitions: [{ name: 'sdc1', fsType: DiskFsType.NTFS, size: 1000204886016 }],
            });
        });

        it('should return disks with temperature when options.temperature is true or omitted', async () => {
            // Mock smartctl output for each disk
            mockExeca
                .mockResolvedValueOnce({
                    // sda - NVMe often doesn't report via smartctl easily, simulate failure
                    stdout: '',
                    stderr: 'smartctl open device: /dev/sda failed: Unknown NVMe device',
                    exitCode: 1,
                    failed: true,
                    command: '',
                    cwd: '',
                    isCanceled: false,
                })
                .mockResolvedValueOnce({
                    // sdb - Standard Temp
                    stdout: `smartctl 7.2 2020-12-30 r5155 [x86_64-linux-5.10.0-8-amd64] (local build)
Copyright (C) 2002-20, Bruce Allen, Christian Franke, www.smartmontools.org

=== START OF READ SMART DATA SECTION ===
SMART Attributes Data Structure revision number: 16
Vendor Specific SMART Attributes with Thresholds:
ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
  1 Raw_Read_Error_Rate     0x000f   119   099   006    Pre-fail  Always       -       197032872
  ...
194 Temperature_Celsius     0x0022   114   091   000    Old_age   Always       -       36 (Min/Max 19/58)
199 UDMA_CRC_Error_Count    0x003e   200   200   000    Old_age   Always       -       0
`,
                    stderr: '',
                    exitCode: 0,
                    failed: false,
                    command: '',
                    cwd: '',
                    isCanceled: false,
                })
                .mockResolvedValueOnce({
                    // sdc - Airflow Temp + Min/Max format
                    stdout: `ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
190 Airflow_Temperature_Cel 0x0022   065   058   045    Old_age   Always       -       35  (Min/Max 30/42 #123)
`,
                    stderr: '',
                    exitCode: 0,
                    failed: false,
                    command: '',
                    cwd: '',
                    isCanceled: false,
                });

            const disks = await service.getDisks(); // Omit options, should default to temperature: true

            expect(mockDiskLayout).toHaveBeenCalledTimes(1);
            expect(mockBlockDevices).toHaveBeenCalledTimes(1);
            // Ensure batchProcess was called correctly
            expect(mockBatchProcess).toHaveBeenCalledTimes(1);
            expect(mockBatchProcess).toHaveBeenCalledWith(mockDiskLayoutData, expect.any(Function));

            // Check that execa was called for each disk inside the batch processor
            expect(mockExeca).toHaveBeenCalledTimes(mockDiskLayoutData.length);
            expect(mockExeca).toHaveBeenCalledWith('smartctl', ['-A', '/dev/sda']);
            expect(mockExeca).toHaveBeenCalledWith('smartctl', ['-A', '/dev/sdb']);
            expect(mockExeca).toHaveBeenCalledWith('smartctl', ['-A', '/dev/sdc']);

            expect(disks).toHaveLength(mockDiskLayoutData.length);
            expect(disks[0].temperature).toBe(-1); // Failed smartctl call
            expect(disks[1].temperature).toBe(36); // Standard temp line
            expect(disks[2].temperature).toBe(35); // Airflow temp line with Min/Max

            // Check other fields remain correct
            expect(disks[1]).toMatchObject({
                id: 'WD-WCC7K7YL9876',
                device: '/dev/sdb',
                interfaceType: DiskInterfaceType.SATA,
                smartStatus: DiskSmartStatus.OK,
                partitions: [{ name: 'sdb1', fsType: DiskFsType.XFS, size: 4000787030016 }],
            });
        });

        it('should handle errors during temperature fetching gracefully', async () => {
            mockExeca.mockRejectedValue(new Error('smartctl command failed'));

            const disks = await service.getDisks({ temperature: true }); // Explicitly true

            expect(mockBatchProcess).toHaveBeenCalledTimes(1);
            expect(mockExeca).toHaveBeenCalledTimes(mockDiskLayoutData.length); // Still attempts for all
            expect(disks).toHaveLength(mockDiskLayoutData.length);
            // All temperatures should be -1 due to errors
            expect(disks[0].temperature).toBe(-1);
            expect(disks[1].temperature).toBe(-1);
            expect(disks[2].temperature).toBe(-1);
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

            const disks = await service.getDisks({ temperature: true });

            expect(disks).toHaveLength(mockDiskLayoutData.length);
            expect(disks[0].temperature).toBe(-1);
            expect(disks[1].temperature).toBe(-1);
            expect(disks[2].temperature).toBe(-1);
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

            const disks = await service.getDisks({ temperature: true });

            expect(disks[0].temperature).toBe(30);
            expect(disks[1].temperature).toBe(30);
            expect(disks[2].temperature).toBe(30);
        });

        it('should handle empty disk layout or block devices', async () => {
            mockDiskLayout.mockResolvedValue([]);
            mockBlockDevices.mockResolvedValue([]);

            const disks = await service.getDisks({ temperature: true });
            expect(disks).toEqual([]);
            expect(mockBatchProcess).toHaveBeenCalledWith([], expect.any(Function));

            mockDiskLayout.mockResolvedValue(mockDiskLayoutData); // Restore for next check
            mockBlockDevices.mockResolvedValue([]);
            const disks2 = await service.getDisks({ temperature: false }); // Temp false path
            expect(disks2).toHaveLength(mockDiskLayoutData.length);
            expect(disks2[0].partitions).toEqual([]);
            expect(disks2[1].partitions).toEqual([]);
            expect(disks2[2].partitions).toEqual([]);
        });
    });

    // --- Test getTemperature (Indirectly via getDisks, but can add specific mocks here if needed) ---
    // Most cases are covered by getDisks tests above.
    // Add specific tests for edge cases in parsing if necessary.
    describe('getTemperature parsing (indirectly tested)', () => {
        // Example: Test specific parsing logic if needed, though covered above.
        it('should correctly parse standard temperature line', async () => {
            // Mock execa for a single disk scenario if testing private method logic
            const singleDisk = mockDiskLayoutData[1]; // WDC disk
            mockDiskLayout.mockResolvedValue([singleDisk]);
            mockExeca.mockResolvedValue({
                stdout: `ID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE
194 Temperature_Celsius     0x0022   114   091   000    Old_age   Always       -       42`, // Different temp
                stderr: '',
                exitCode: 0,
                failed: false,
                command: '',
                cwd: '',
                isCanceled: false,
            });

            const disks = await service.getDisks({ temperature: true });
            expect(disks).toHaveLength(1);
            expect(disks[0].temperature).toBe(42);
        });
    });
});
