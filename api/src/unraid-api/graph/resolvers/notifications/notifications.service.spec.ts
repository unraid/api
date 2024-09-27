import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { describe, beforeEach, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import {
    Importance,
    type NotificationData,
    NotificationType,
    type Notification,
} from '@app/graphql/generated/api/types';

describe('NotificationsService', () => {
    let service: NotificationsService;
    const basePath = '/tmp/test/notifications';
    const testPaths = {
        basePath,
        UNREAD: `${basePath}/unread`,
        ARCHIVE: `${basePath}/archive`,
    };

    /**------------------------------------------------------------------------
     *                           Lifecycle Setup
     *------------------------------------------------------------------------**/

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NotificationsService],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService); // this might need to be a module.resolve instead of get
        vi.spyOn(service, 'paths').mockImplementation(() => testPaths);

        // clear the notifications directory
        await mkdir(testPaths.basePath, { recursive: true });
        await rm(testPaths.basePath, { force: true, recursive: true });

        // init notification directories
        await mkdir(testPaths.UNREAD, { recursive: true });
        await mkdir(testPaths.ARCHIVE, { recursive: true });
    });

    afterAll(async () => {
        // clear notifications directory
        await rm(testPaths.basePath, { force: true, recursive: true });
    });

    /**------------------------------------------------------------------------
     *                           Helper Functions
     *------------------------------------------------------------------------**/

    async function createNotification(data: Partial<NotificationData> = {}) {
        const {
            title = 'Test Notification',
            subject = 'Test Subject',
            description = 'Test Description',
            importance = Importance.INFO,
        } = data;
        return service.createNotification({ title, subject, description, importance });
    }

    async function findById(id: string, type: NotificationType = NotificationType.UNREAD) {
        return (await service.getNotifications({ type, limit: 50, offset: 0 })).find(
            (notification) => notification.id === id
        );
    }

    async function doesExist(
        { id }: Pick<Notification, 'id'>,
        type: NotificationType = NotificationType.UNREAD
    ) {
        const storedNotification = await findById(id, type);
        expect(storedNotification).toBeDefined();
        return !!storedNotification;
    }

    async function forEachImportance(action: (importance: Importance) => Promise<void>) {
        for (const importance of Object.values(Importance)) {
            await action(importance);
        }
    }

    async function forEachType(action: (type: NotificationType) => Promise<void>) {
        for (const type of Object.values(NotificationType)) {
            await action(type);
        }
    }

    async function forAllTypesAndImportances(
        action: (type: NotificationType, importance: Importance) => Promise<void>
    ) {
        await forEachType(async (type) => {
            await forEachImportance(async (importance) => {
                await action(type, importance);
            });
        });
    }

    /**------------------------------------------------------------------------
     *                           Sanity Tests
     *------------------------------------------------------------------------**/

    it('NotificationsService test setup should be defined', () => {
        expect(service).toBeDefined();
        expect(service.paths()).toEqual(testPaths);
        Object.values(testPaths).forEach((path) => expect(existsSync(path)).toBeTruthy());
    });

    it('can correctly create, load, and delete a notification', async () => {
        const notificationData: NotificationData = {
            title: 'Test Notification',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: Importance.INFO,
        };
        const notification = await createNotification(notificationData);

        // data in returned notification matches?
        Object.entries(notificationData).forEach(([key, value]) => {
            expect(notification[key]).toEqual(value);
        });

        // data in stored notification matches?
        const storedNotification = await findById(notification.id);
        expect(storedNotification).toBeDefined();
        if (!storedNotification) {
            return;
        }

        expect(storedNotification.id).toEqual(notification.id);
        expect(storedNotification.timestamp).toEqual(notification.timestamp);
        Object.entries(notificationData).forEach(([key, value]) => {
            expect(storedNotification[key]).toEqual(value);
        });

        // notification was deleted
        await service.deleteNotification({ id: notification.id, type: NotificationType.UNREAD });
        const deleted = await findById(notification.id);
        expect(deleted).toBeUndefined();
    });

    it('can correctly archive and unarchive a notification', async () => {
        await forEachImportance(async (importance) => {
            const notification = await createNotification({ importance });

            await service.archiveNotification(notification);
            let exists = await doesExist(notification, NotificationType.ARCHIVE);
            if (!exists) return;

            await service.markAsUnread(notification);
            exists = await doesExist(notification, NotificationType.UNREAD);
        });
    });

    it('can archive & unarchive all', async () => {
        await forEachImportance(async (importance) => {
            const notifications = await Promise.all([
                createNotification({ importance }),
                createNotification({ importance }),
                createNotification({ importance }),
                createNotification({ importance }),
                createNotification({ importance }),
            ]);

            expect(notifications.length).toEqual(5);
            await service.archiveAll();
            await service.unarchiveAll();
            await service.archiveAll(importance);
            await service.unarchiveAll(importance);
        });
    });
});
