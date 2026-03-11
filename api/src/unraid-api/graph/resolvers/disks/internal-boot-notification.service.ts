import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import type { NotificationData } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { NotificationImportance } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

const BOOT_CHECK_RETRY_COUNT = 5;
const BOOT_CHECK_RETRY_DELAY_MS = 1_000;

@Injectable()
export class InternalBootNotificationService implements OnApplicationBootstrap {
    private readonly logger = new Logger(InternalBootNotificationService.name);

    constructor(
        private readonly arrayService: ArrayService,
        private readonly disksService: DisksService,
        private readonly notificationsService: NotificationsService
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const bootDisk = await this.getBootDisk();
        if (!bootDisk) {
            this.logger.debug('Skipping internal boot notification: no boot disk found');
            return;
        }

        this.logger.debug(
            `Resolved boot disk during bootstrap: ${bootDisk.device ?? bootDisk.id} (${bootDisk.type})`
        );

        if (bootDisk.type !== ArrayDiskType.FLASH) {
            this.logger.debug(
                `Skipping internal boot notification: boot disk ${bootDisk.device ?? bootDisk.id} is ${bootDisk.type}`
            );
            return;
        }

        const internalBootDevices = await this.disksService.getInternalBootDevices();
        if (internalBootDevices.length === 0) {
            this.logger.debug(
                `Skipping internal boot notification: no internal boot candidates found for ${bootDisk.device ?? bootDisk.id}`
            );
            return;
        }

        const notification = await this.notificationsService.notifyIfUnique(this.getNotificationData());
        if (notification) {
            this.logger.log(
                `Created internal boot notification for USB boot device ${bootDisk.device ?? bootDisk.id}`
            );
            return;
        }

        this.logger.debug('Internal boot notification already exists; skipping duplicate');
    }

    private async getBootDisk() {
        for (let attempt = 1; attempt <= BOOT_CHECK_RETRY_COUNT; attempt += 1) {
            try {
                const array = await this.arrayService.getArrayData();
                return array.boot;
            } catch (error) {
                if (attempt === BOOT_CHECK_RETRY_COUNT) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.logger.warn(`Failed to inspect boot disk during bootstrap: ${message}`);
                    return undefined;
                }

                await this.delay(BOOT_CHECK_RETRY_DELAY_MS);
            }
        }

        return undefined;
    }

    private getNotificationData(): NotificationData {
        return {
            title: 'Unraid Booted from USB Device',
            subject: 'Internal Boot Available',
            description:
                'This system supports internal boot, but Unraid is currently running from a USB flash device. Please change your boot order via your motherboard BIOS.',
            importance: NotificationImportance.ALERT,
        };
    }

    private async delay(ms: number): Promise<void> {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
