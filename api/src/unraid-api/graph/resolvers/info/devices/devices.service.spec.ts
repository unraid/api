import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices/devices.service.js';

// Mock external dependencies
vi.mock('fs/promises', () => ({
    access: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('execa', () => ({
    execa: vi.fn(),
}));

vi.mock('path-type', () => ({
    isSymlink: vi.fn().mockResolvedValue(false),
}));

vi.mock('@app/core/utils/vms/get-pci-devices.js', () => ({
    getPciDevices: vi.fn(),
}));

vi.mock('@app/core/utils/vms/filter-devices.js', () => ({
    filterDevices: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: () => ({
            var: {
                flashGuid: 'test-flash-guid',
            },
        }),
    },
}));

describe('DevicesService', () => {
    let service: DevicesService;
    let mockExeca: any;
    let mockGetPciDevices: any;
    let mockFilterDevices: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [DevicesService],
        }).compile();

        service = module.get<DevicesService>(DevicesService);

        mockExeca = await import('execa');
        mockGetPciDevices = await import('@app/core/utils/vms/get-pci-devices.js');
        mockFilterDevices = await import('@app/core/utils/vms/filter-devices.js');
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateGpu', () => {
        it('should return GPU devices from PCI devices', async () => {
            const mockPciDevices = [
                {
                    id: '01:00.0',
                    typeid: '0300',
                    vendorname: 'NVIDIA',
                    productname: 'GeForce RTX 3080',
                    product: '2206',
                    manufacturer: 'NVIDIA',
                    allowed: false,
                    class: 'vga',
                },
                {
                    id: '02:00.0',
                    typeid: '0403',
                    vendorname: 'Intel',
                    productname: 'Audio Controller',
                    product: '1234',
                    manufacturer: 'Intel',
                    allowed: false,
                    class: 'audio',
                },
            ];

            mockGetPciDevices.getPciDevices.mockResolvedValue(mockPciDevices);
            mockFilterDevices.filterDevices.mockResolvedValue(mockPciDevices);

            const result = await service.generateGpu();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: 'gpu/01:00.0',
                blacklisted: false,
                class: 'vga',
                productid: '2206',
                typeid: '0300',
                type: 'NVIDIA',
                vendorname: 'NVIDIA',
            });
        });

        it('should handle errors gracefully', async () => {
            mockGetPciDevices.getPciDevices.mockRejectedValue(new Error('PCI error'));

            const result = await service.generateGpu();

            expect(result).toEqual([]);
        });
    });

    describe('generatePci', () => {
        it('should return all PCI devices', async () => {
            const mockPciDevices = [
                {
                    id: '01:00.0',
                    typeid: '0300',
                    vendorname: 'NVIDIA',
                    productname: 'GeForce RTX 3080',
                    product: '2206',
                    manufacturer: 'NVIDIA',
                    allowed: false,
                    class: 'vga',
                },
            ];

            mockGetPciDevices.getPciDevices.mockResolvedValue(mockPciDevices);
            mockFilterDevices.filterDevices.mockResolvedValue(mockPciDevices);

            const result = await service.generatePci();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: 'pci/01:00.0',
                type: 'NVIDIA',
                typeid: '0300',
                vendorname: 'NVIDIA',
                vendorid: '0300',
                productname: 'GeForce RTX 3080',
                productid: '2206',
                blacklisted: 'false',
                class: 'vga',
            });
        });

        it('should handle errors gracefully', async () => {
            mockGetPciDevices.getPciDevices.mockRejectedValue(new Error('PCI error'));

            const result = await service.generatePci();

            expect(result).toEqual([]);
        });
    });

    describe('generateUsb', () => {
        it('should return USB devices', async () => {
            mockExeca.execa
                .mockResolvedValueOnce({ stdout: '' }) // Empty USB hubs to avoid filtering
                .mockResolvedValueOnce({
                    stdout: 'Bus 001 Device 002: ID 1234:5678 Test USB Device\nBus 001 Device 003: ID abcd:ef01 Another Device',
                }); // USB devices

            const result = await service.generateUsb();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'usb/1234:5678',
                name: 'Test USB Device',
            });
            expect(result[1]).toEqual({
                id: 'usb/abcd:ef01',
                name: 'Another Device',
            });
        });

        it('should handle errors gracefully', async () => {
            mockExeca.execa.mockRejectedValue(new Error('USB error'));

            const result = await service.generateUsb();

            expect(result).toEqual([]);
        });
    });
});
