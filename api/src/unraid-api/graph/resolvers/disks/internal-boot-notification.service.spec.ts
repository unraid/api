import type { TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { InternalBootNotificationService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-notification.service.js';
import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';
import { NotificationImportance } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

const mockArrayService = {
    getArrayData: vi.fn(),
};

const mockInternalBootStateService = {
    getBootedFromFlashWithInternalBootSetupForBootDisk: vi.fn(),
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
                    provide: InternalBootStateService,
                    useValue: mockInternalBootStateService,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<InternalBootNotificationService>(InternalBootNotificationService);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates an alert notification when booted from flash and internal boot devices are available', async () => {
        mockArrayService.getArrayData.mockResolvedValue({
            boot: {
                id: 'flash',
                type: ArrayDiskType.FLASH,
                device: 'sda',
            },
        });
        mockInternalBootStateService.getBootedFromFlashWithInternalBootSetupForBootDisk.mockResolvedValue(
            true
        );
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
        mockInternalBootStateService.getBootedFromFlashWithInternalBootSetupForBootDisk.mockResolvedValue(
            true
        );

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
        mockInternalBootStateService.getBootedFromFlashWithInternalBootSetupForBootDisk.mockResolvedValue(
            false
        );

        await service.onApplicationBootstrap();

        expect(mockNotificationsService.notifyIfUnique).not.toHaveBeenCalled();
    });

    it('retries until a boot disk becomes available', async () => {
        vi.useFakeTimers();

        mockArrayService.getArrayData
            .mockResolvedValueOnce({
                boot: undefined,
            })
            .mockResolvedValueOnce({
                boot: {
                    id: 'flash',
                    type: ArrayDiskType.FLASH,
                    device: 'sda',
                },
            });
        mockInternalBootStateService.getBootedFromFlashWithInternalBootSetupForBootDisk.mockResolvedValue(
            true
        );
        mockNotificationsService.notifyIfUnique.mockResolvedValue(null);

        const bootstrapPromise = service.onApplicationBootstrap();

        await vi.runAllTimersAsync();
        await bootstrapPromise;

        expect(mockArrayService.getArrayData).toHaveBeenCalledTimes(2);
        expect(mockNotificationsService.notifyIfUnique).toHaveBeenCalledTimes(1);
    });

    it('does not create a notification when no boot disk is available after retries', async () => {
        vi.useFakeTimers();
        const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

        mockArrayService.getArrayData.mockResolvedValue({
            boot: undefined,
        });
        mockInternalBootStateService.getBootedFromFlashWithInternalBootSetupForBootDisk.mockResolvedValue(
            true
        );

        const bootstrapPromise = service.onApplicationBootstrap();

        await vi.runAllTimersAsync();
        await bootstrapPromise;

        expect(mockArrayService.getArrayData).toHaveBeenCalledTimes(5);
        expect(mockNotificationsService.notifyIfUnique).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to inspect boot disk during bootstrap: no boot disk found'
        );
    });

    it('does not throw when internal boot detection fails during bootstrap', async () => {
        const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

        mockArrayService.getArrayData.mockResolvedValue({
            boot: {
                id: 'flash',
                type: ArrayDiskType.FLASH,
                device: 'sda',
            },
        });
        mockInternalBootStateService.getBootedFromFlashWithInternalBootSetupForBootDisk.mockRejectedValue(
            new Error('lsblk failed')
        );

        await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

        expect(mockNotificationsService.notifyIfUnique).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to evaluate internal boot notification for sda: lsblk failed'
        );
    });

    it('does not throw when notification creation fails during bootstrap', async () => {
        const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

        mockArrayService.getArrayData.mockResolvedValue({
            boot: {
                id: 'flash',
                type: ArrayDiskType.FLASH,
                device: 'sda',
            },
        });
        mockInternalBootStateService.getBootedFromFlashWithInternalBootSetupForBootDisk.mockResolvedValue(
            true
        );
        mockNotificationsService.notifyIfUnique.mockRejectedValue(new Error('notify failed'));

        await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to evaluate internal boot notification for sda: notify failed'
        );
    });
});
