import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { existsSync } from 'fs';
import {
    Importance,
    type NotificationData,
    NotificationType,
    type Notification,
    type NotificationOverview,
    type NotificationCounts,
    type NotificationFilter,
} from '@app/graphql/generated/api/types';
import { NotificationSchema } from '@app/graphql/generated/api/operations';

// defined outside `describe` so it's defined inside the `beforeAll`
// needed to mock the dynamix import
const basePath = '/tmp/test/notifications';

// we run sequentially here because this module's state depends on external, shared systems
// rn, it's complicated to make the tests atomic & isolated
describe.sequential('NotificationsService', () => {
    const notificationImportance = Object.values(Importance);
    let service: NotificationsService;
    const testPaths = {
        basePath,
        UNREAD: `${basePath}/unread`,
        ARCHIVE: `${basePath}/archive`,
    };

    /**------------------------------------------------------------------------
     *                           Lifecycle Setup
     *------------------------------------------------------------------------**/

    beforeAll(async () => {
        // need to mock the dynamix import bc the file watcher is init'ed in the service constructor
        // i.e. before we can mock service.paths()
        vi.mock(import('../../../../store'), async (importOriginal) => {
            const mod = await importOriginal();
            return {
                ...mod,
                getters: {
                    dynamix: () => ({
                        notify: { path: basePath },
                    }),
                },
            } as typeof mod;
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [NotificationsService],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService); // this might need to be a module.resolve instead of get
        vi.spyOn(service, 'paths').mockImplementation(() => testPaths);

        await service.deleteAllNotifications();
    });

    // make sure each test is isolated (as much as possible)
    afterEach(async () => {
        await service.deleteAllNotifications();
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

    // Some of these helpers accept `expect` implementations,
    // which allows them to be used in concurrent tests
    // e.g. doesExist(expect)(id, type)
    function doesExist(expectImplementation: typeof expect) {
        /** Asserts & returns whether a notification with the given id and type exists. */
        return async (
            { id }: Pick<Notification, 'id'>,
            type: NotificationType = NotificationType.UNREAD
        ) => {
            const storedNotification = await findById(id, type);
            expectImplementation(storedNotification).toBeDefined();
            return !!storedNotification;
        };
    }

    async function forEachImportance(action: (importance: Importance) => Promise<void>) {
        for (const importance of notificationImportance) {
            await action(importance);
        }
    }

    async function forEachType(action: (type: NotificationType) => Promise<void>) {
        for (const type of Object.values(NotificationType)) {
            await action(type);
        }
    }

    // currently unused b/c of difficulty implementing NotificationOverview tests
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function forAllTypesAndImportances(
        action: (type: NotificationType, importance: Importance) => Promise<void>
    ) {
        await forEachType(async (type) => {
            await forEachImportance(async (importance) => {
                await action(type, importance);
            });
        });
    }

    function diffCounts(current: NotificationCounts, previous: NotificationCounts) {
        return Object.fromEntries(
            Object.entries(current).map(([key]) => {
                return [key, current[key] - previous[key]] as const;
            })
        );
    }

    // currently unused b/c of difficulty implementing NotificationOverview tests
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function diffOverview(current: NotificationOverview, previous: NotificationOverview) {
        return Object.fromEntries(
            Object.entries(current).map(([key]) => {
                return [key, diffCounts(current[key], previous[key])];
            })
        );
    }

    const makeExpectIn =
        (expectImplementation: typeof expect) =>
        /**
         * Loads notifications from the service and asserts that the expected amount is returned.
         *
         * @param params
         * @param amount
         */
        async (params: Partial<NotificationFilter> & { type: NotificationType }, amount: number) => {
            const { limit = 50, offset = 0, importance, type } = params;
            const loaded = await service.getNotifications({
                type,
                importance,
                limit,
                offset,
            });
            expectImplementation(loaded.length).toEqual(amount);
        };

    /**------------------------------------------------------------------------
     *                           Sanity Tests
     *------------------------------------------------------------------------**/

    it('test setup is correctly defined', ({ expect }) => {
        expect(service).toBeDefined();
        expect(service.paths()).toEqual(testPaths);
        const snapshot = service.getOverview();
        Object.values(testPaths).forEach((path) => expect(existsSync(path)).toBeTruthy());

        const endSnapshot = service.getOverview();
        expect(snapshot).toEqual(endSnapshot);

        // check that all counts are 0
        Object.values(snapshot.archive).forEach((count) => {
            expect(count).toEqual(0);
        });
        Object.values(snapshot.unread).forEach((count) => {
            expect(count).toEqual(0);
        });
    });

    it('generates unique ids', async () => {
        const notifications = await Promise.all([...new Array(100)].map(() => createNotification()));
        const notificationIds = new Set(notifications.map((notification) => notification.id));
        expect(notificationIds.size).toEqual(notifications.length);
    });

    it('returns ISO timestamps', async () => {
        const isISODate = (date: string) => new Date(date).toISOString() === date;
        const created = await createNotification();
        const loaded = await findById(created.id);
        expect(isISODate(created.timestamp ?? '')).toBeTruthy();
        expect(isISODate(loaded?.timestamp ?? '')).toBeTruthy();
    });

    it('generates gql-compatible notifications', async () => {
        const created = await createNotification();
        const loaded = await findById(created.id);
        const { success } = NotificationSchema().safeParse(loaded);
        expect(success).toBeTruthy();
    });

    /**========================================================================
     *                           CRUD Smoke Tests
     *========================================================================**/

    it('can correctly create, load, and delete a notification', async ({ expect }) => {
        const notificationData: NotificationData = {
            title: 'Test Notification',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: Importance.INFO,
        };
        const notification = await createNotification(notificationData);

        // data in returned notification (from createNotification) matches?
        Object.entries(notificationData).forEach(([key, value]) => {
            expect(notification[key]).toEqual(value);
        });

        // data in stored notification matches?
        const storedNotification = await findById(notification.id);
        expect(storedNotification).toBeDefined();
        if (!storedNotification) return; // stop the test if there's no stored notification
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

    it.each(notificationImportance)('loadNotifications respects %s filter', async (importance) => {
        const notifications = await Promise.all([
            createNotification({ importance: Importance.ALERT }),
            createNotification({ importance: Importance.ALERT }),
            createNotification({ importance: Importance.ALERT }),
            createNotification({ importance: Importance.INFO }),
            createNotification({ importance: Importance.INFO }),
            createNotification({ importance: Importance.INFO }),
            createNotification({ importance: Importance.WARNING }),
            createNotification({ importance: Importance.WARNING }),
            createNotification({ importance: Importance.WARNING }),
        ]);
        expect(notifications.length).toEqual(9);

        // don't use the `expectIn` helper, just in case it changes
        const loaded = await service.getNotifications({
            type: NotificationType.UNREAD,
            importance,
            limit: 50,
            offset: 0,
        });
        expect(loaded.length).toEqual(3);
    });

    /**--------------------------------------------
     *               CRUD: Update Tests
     *---------------------------------------------**/

    it('can correctly archive and unarchive a notification', async ({ expect }) => {
        await forEachImportance(async (importance) => {
            const notification = await createNotification({ importance });

            await service.archiveNotification(notification);
            let exists = await doesExist(expect)(notification, NotificationType.ARCHIVE);
            if (!exists) return;

            await service.markAsUnread(notification);
            exists = await doesExist(expect)(notification, NotificationType.UNREAD);
        });
    });

    it.each(notificationImportance)('can archiveAll & unarchiveAll %s', async (importance) => {
        const expectIn = makeExpectIn(expect);
        const notifications = await Promise.all([
            createNotification({ importance: Importance.ALERT }),
            createNotification({ importance: Importance.ALERT }),
            createNotification({ importance: Importance.ALERT }),
            createNotification({ importance: Importance.INFO }),
            createNotification({ importance: Importance.INFO }),
            createNotification({ importance: Importance.INFO }),
            createNotification({ importance: Importance.WARNING }),
            createNotification({ importance: Importance.WARNING }),
            createNotification({ importance: Importance.WARNING }),
        ]);
        expect(notifications.length).toEqual(9);
        await expectIn({ type: NotificationType.UNREAD }, 9);

        await service.archiveAll();
        await expectIn({ type: NotificationType.ARCHIVE }, 9);

        await service.unarchiveAll();
        await expectIn({ type: NotificationType.UNREAD }, 9);

        await service.archiveAll(importance);
        await expectIn({ type: NotificationType.ARCHIVE }, 3);
        await expectIn({ type: NotificationType.UNREAD }, 6);

        // archive another importance set, just to make sure unarchiveAll
        // isn't just ignoring the filter, which would be possible if it only
        // contained the stuff it was supposed to unarchive.

        const anotherImportance = importance === Importance.ALERT ? Importance.INFO : Importance.ALERT;
        await service.archiveAll(anotherImportance);
        await expectIn({ type: NotificationType.ARCHIVE }, 6);
        await expectIn({ type: NotificationType.UNREAD }, 3);

        await service.unarchiveAll(importance);
        await expectIn({ type: NotificationType.ARCHIVE }, 3);
        await expectIn({ type: NotificationType.UNREAD }, 6);
    });

    /**========================================================================
     *                           Overview (Notification Stats) State
     *========================================================================**/

    it.skip('calculates stats correctly', async () => {
        // todo implement
    });
});
