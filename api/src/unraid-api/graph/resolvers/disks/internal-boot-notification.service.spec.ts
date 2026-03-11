import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { InternalBootNotificationService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-notification.service.js';
import { NotificationImportance } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

const mockArrayService = {
    getArrayData: vi.fn(),
};

const mockDisksService = {
    getInternalBootDevices: vi.fn(),
};

const mockNotificationsService = {
    notifyIfUnique: vi.fn(),
};

describe('InternalBootNotificationService', () => {
    let service: InternalBootNotificationService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InternalBootNotificationService,
                {
                    provide: ArrayService,
                    useValue: mockArrayService,
                },
                {
                    provide: DisksService,
                    useValue: mockDisksService,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<InternalBootNotificationService>(InternalBootNotificationService);
    });

    it('creates an alert notification when booted from flash and internal boot devices are available', async () => {
        mockArrayService.getArrayData.mockResolvedValue({
            boot: {
                id: 'flash',
                type: ArrayDiskType.FLASH,
                device: 'sda',
            },
        });
        mockDisksService.getInternalBootDevices.mockResolvedValue([{ device: '/dev/nvme0n1' }]);
        mockNotificationsService.notifyIfUnique.mockResolvedValue(null);

        await service.onApplicationBootstrap();

        expect(mockNotificationsService.notifyIfUnique).toHaveBeenCalledWith({
            title: 'Unraid Booted from USB Device',
            subject: 'Internal Boot Available',
            description:
                'This system supports internal boot, but Unraid is currently running from a USB flash device. Please change your boot order via your motherboard BIOS.',
            importance: NotificationImportance.ALERT,
        });
    });

    it('does not create a notification when the current boot device is not flash', async () => {
        mockArrayService.getArrayData.mockResolvedValue({
            boot: {
                id: 'boot',
                type: ArrayDiskType.BOOT,
                device: 'nvme0n1',
            },
        });
        mockDisksService.getInternalBootDevices.mockResolvedValue([{ device: '/dev/nvme0n1' }]);

        await service.onApplicationBootstrap();

        expect(mockNotificationsService.notifyIfUnique).not.toHaveBeenCalled();
    });

    it('does not create a notification when no internal boot devices are detected', async () => {
        mockArrayService.getArrayData.mockResolvedValue({
            boot: {
                id: 'flash',
                type: ArrayDiskType.FLASH,
                device: 'sda',
            },
        });
        mockDisksService.getInternalBootDevices.mockResolvedValue([]);

        await service.onApplicationBootstrap();

        expect(mockNotificationsService.notifyIfUnique).not.toHaveBeenCalled();
    });

    it('does not create a notification when no boot disk is available', async () => {
        mockArrayService.getArrayData.mockResolvedValue({
            boot: undefined,
        });
        mockDisksService.getInternalBootDevices.mockResolvedValue([{ device: '/dev/nvme0n1' }]);

        await service.onApplicationBootstrap();

        expect(mockNotificationsService.notifyIfUnique).not.toHaveBeenCalled();
    });
});
