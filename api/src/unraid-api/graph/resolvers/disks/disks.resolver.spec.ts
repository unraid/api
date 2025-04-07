import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Disk } from '@app/graphql/generated/api/types.js';
import { DiskInterfaceType, DiskSmartStatus } from '@app/graphql/generated/api/types.js';
import { DisksResolver } from '@app/unraid-api/graph/resolvers/disks/disks.resolver.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js'; // Renamed from DiskService

// Mock the DisksService
const mockDisksService = {
    getDisks: vi.fn(),
    getTemperature: vi.fn(),
};

describe('DisksResolver', () => {
    let resolver: DisksResolver;
    let service: DisksService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DisksResolver,
                {
                    provide: DisksService,
                    useValue: mockDisksService,
                },
            ],
        }).compile();

        resolver = module.get<DisksResolver>(DisksResolver);
        service = module.get<DisksService>(DisksService);

        // Reset mocks before each test
        vi.clearAllMocks();
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('disks', () => {
        it('should return an array of disks', async () => {
            const mockResult: Disk[] = [
                {
                    id: 'SERIAL123',
                    device: '/dev/sda',
                    type: 'SSD',
                    name: 'Samsung SSD 860 EVO 1TB',
                    vendor: 'Samsung',
                    size: 1000204886016,
                    bytesPerSector: 512,
                    totalCylinders: 121601,
                    totalHeads: 255,
                    totalSectors: 1953525168,
                    totalTracks: 31008255,
                    tracksPerCylinder: 255,
                    sectorsPerTrack: 63,
                    firmwareRevision: 'RVT04B6Q',
                    serialNum: 'SERIAL123',
                    interfaceType: DiskInterfaceType.SATA,
                    smartStatus: DiskSmartStatus.OK,
                    temperature: -1,
                    partitions: [],
                },
            ];
            mockDisksService.getDisks.mockResolvedValue(mockResult);

            const result = await resolver.disks();

            expect(result).toEqual(mockResult);
            expect(service.getDisks).toHaveBeenCalledTimes(1);
            expect(service.getDisks).toHaveBeenCalledWith();
        });

        it('should call the service', async () => {
            mockDisksService.getDisks.mockResolvedValue([]); // Return empty for simplicity

            await resolver.disks();

            expect(service.getDisks).toHaveBeenCalledTimes(1);
            expect(service.getDisks).toHaveBeenCalledWith();
        });
    });

    describe('temperature', () => {
        it('should call getTemperature with the disk device', async () => {
            const mockDisk: Disk = {
                id: 'SERIAL123',
                device: '/dev/sda',
                type: 'SSD',
                name: 'Samsung SSD 860 EVO 1TB',
                vendor: 'Samsung',
                size: 1000204886016,
                bytesPerSector: 512,
                totalCylinders: 121601,
                totalHeads: 255,
                totalSectors: 1953525168,
                totalTracks: 31008255,
                tracksPerCylinder: 255,
                sectorsPerTrack: 63,
                firmwareRevision: 'RVT04B6Q',
                serialNum: 'SERIAL123',
                interfaceType: DiskInterfaceType.SATA,
                smartStatus: DiskSmartStatus.OK,
                temperature: -1,
                partitions: [],
            };
            
            mockDisksService.getTemperature.mockResolvedValue(42);
            
            const result = await resolver.temperature(mockDisk);
            
            expect(result).toBe(42);
            expect(service.getTemperature).toHaveBeenCalledTimes(1);
            expect(service.getTemperature).toHaveBeenCalledWith('/dev/sda');
        });
    });
});
