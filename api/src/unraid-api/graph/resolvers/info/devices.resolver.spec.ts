import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DevicesResolver } from '@app/unraid-api/graph/resolvers/info/devices.resolver.js';
import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices.service.js';

describe('DevicesResolver', () => {
    let resolver: DevicesResolver;
    let devicesService: DevicesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DevicesResolver,
                {
                    provide: DevicesService,
                    useValue: {
                        generateGpu: vi.fn(),
                        generatePci: vi.fn(),
                        generateUsb: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<DevicesResolver>(DevicesResolver);
        devicesService = module.get<DevicesService>(DevicesService);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('gpu', () => {
        it('should call devicesService.generateGpu', async () => {
            const mockGpus = [
                {
                    id: 'gpu/01:00.0',
                    blacklisted: false,
                    class: 'vga',
                    productid: '2206',
                    typeid: '0300',
                    type: 'NVIDIA',
                    vendorname: 'NVIDIA',
                },
            ];

            vi.mocked(devicesService.generateGpu).mockResolvedValue(mockGpus);

            const result = await resolver.gpu();

            expect(devicesService.generateGpu).toHaveBeenCalledOnce();
            expect(result).toEqual(mockGpus);
        });
    });

    describe('pci', () => {
        it('should call devicesService.generatePci', async () => {
            const mockPciDevices = [
                {
                    id: 'pci/01:00.0',
                    type: 'NVIDIA',
                    typeid: '0300',
                    vendorname: 'NVIDIA',
                    vendorid: '0300',
                    productname: 'GeForce RTX 3080',
                    productid: '2206',
                    blacklisted: 'false',
                    class: 'vga',
                },
            ];

            vi.mocked(devicesService.generatePci).mockResolvedValue(mockPciDevices);

            const result = await resolver.pci();

            expect(devicesService.generatePci).toHaveBeenCalledOnce();
            expect(result).toEqual(mockPciDevices);
        });
    });

    describe('usb', () => {
        it('should call devicesService.generateUsb', async () => {
            const mockUsbDevices = [
                {
                    id: 'usb/1234:5678',
                    name: 'Test USB Device',
                },
            ];

            vi.mocked(devicesService.generateUsb).mockResolvedValue(mockUsbDevices);

            const result = await resolver.usb();

            expect(devicesService.generateUsb).toHaveBeenCalledOnce();
            expect(result).toEqual(mockUsbDevices);
        });
    });
});
