import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

import { execa } from 'execa';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { NotificationIni } from '@app/core/types/states/notification.js';
import {
    Notification,
    NotificationCounts,
    NotificationData,
    NotificationFilter,
    NotificationImportance,
    NotificationOverview,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';

// defined outside `describe` so it's defined inside the `beforeAll`
// needed to mock the dynamix import
const basePath = '/tmp/test/notifications';

// we run sequentially here because this module's state depends on external, shared systems
// rn, it's complicated to make the tests atomic & isolated
describe.sequential('NotificationsService', () => {
    const notificationImportance = Object.values(NotificationImportance);
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
        await mkdir(basePath, { recursive: true });
        // need to mock the dynamix import bc the file watcher is init'ed in the service constructor
        // i.e. before we can mock service.paths()
        vi.mock(import('../../../../store/index.js'), async (importOriginal) => {
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
            importance = NotificationImportance.INFO,
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

    async function forEachImportance(action: (importance: NotificationImportance) => Promise<void>) {
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

    async function forAllTypesAndImportances(
        action: (type: NotificationType, importance: NotificationImportance) => Promise<void>
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
        const notifications = await Promise.all(
            // we break the "rules" here to speed up this test by ~450ms
            // @ts-expect-error makeNotificationId is private
            [...new Array(100)].map(() => service.makeNotificationId('test event'))
        );
        const notificationIds = new Set(notifications);
        expect(notificationIds.size).toEqual(notifications.length);
    });

    it('returns ISO timestamps', async () => {
        const isISODate = (date: string) => new Date(date).toISOString() === date;
        const created = await createNotification();
        const loaded = await findById(created.id);

        console.log(created.timestamp);
        console.log(loaded?.timestamp);

        expect(isISODate(created.timestamp ?? '')).toBeTruthy();
        expect(isISODate(loaded?.timestamp ?? '')).toBeTruthy();
    });

    it('generates gql-compatible notifications', async () => {
        const created = await createNotification();
        const loaded = await findById(created.id);
        const validated = await validateObject(Notification, loaded);
        expect(validated).toEqual(loaded);
    });

    /**========================================================================
     *                           CRUD Smoke Tests
     *========================================================================**/

    it('can correctly create, load, and delete a notification', async ({ expect }) => {
        const notificationData: NotificationData = {
            title: 'Test Notification',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: NotificationImportance.INFO,
        };
        const notification = await createNotification(notificationData);

        // HACK: we brute-force re-calculate instead of using service.getOverview()
        // because the file-system-watcher's test setup isn't working rn.
        let { overview } = await service.recalculateOverview();
        expect.soft(overview.unread.total).toEqual(1);

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

        ({ overview } = await service.recalculateOverview());
        expect.soft(overview.unread.total).toEqual(0);
    });

    it.each(notificationImportance)('loadNotifications respects %s filter', async (importance) => {
        const notifications = await Promise.all([
            createNotification({ importance: NotificationImportance.ALERT }),
            createNotification({ importance: NotificationImportance.ALERT }),
            createNotification({ importance: NotificationImportance.ALERT }),
            createNotification({ importance: NotificationImportance.INFO }),
            createNotification({ importance: NotificationImportance.INFO }),
            createNotification({ importance: NotificationImportance.INFO }),
            createNotification({ importance: NotificationImportance.WARNING }),
            createNotification({ importance: NotificationImportance.WARNING }),
            createNotification({ importance: NotificationImportance.WARNING }),
        ]);
        const { overview } = await service.recalculateOverview();
        expect(notifications.length).toEqual(9);
        expect.soft(overview.unread.total).toEqual(9);

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

    it.for(notificationImportance.map((i) => [i]))(
        'can correctly archive and unarchive a %s notification',
        async ([importance], { expect }) => {
            const notification = await createNotification({ importance });
            let { overview } = await service.recalculateOverview();
            expect.soft(overview.unread.total).toEqual(1);
            expect.soft(overview.archive.total).toEqual(0);

            await service.archiveNotification(notification);
            let exists = await doesExist(expect)(notification, NotificationType.ARCHIVE);
            if (!exists) return;

            ({ overview } = await service.recalculateOverview());
            expect.soft(overview.unread.total).toEqual(0);
            expect.soft(overview.archive.total).toEqual(1);

            await service.markAsUnread(notification);
            exists = await doesExist(expect)(notification, NotificationType.UNREAD);
            ({ overview } = await service.recalculateOverview());
            expect.soft(overview.unread.total).toEqual(1);
            expect.soft(overview.archive.total).toEqual(0);
        }
    );

    it.each(notificationImportance)('can archiveAll & unarchiveAll %s', async (importance) => {
        const expectIn = makeExpectIn(expect);
        const notifications = await Promise.all([
            createNotification({ importance: NotificationImportance.ALERT }),
            createNotification({ importance: NotificationImportance.ALERT }),
            createNotification({ importance: NotificationImportance.ALERT }),
            createNotification({ importance: NotificationImportance.INFO }),
            createNotification({ importance: NotificationImportance.INFO }),
            createNotification({ importance: NotificationImportance.INFO }),
            createNotification({ importance: NotificationImportance.WARNING }),
            createNotification({ importance: NotificationImportance.WARNING }),
            createNotification({ importance: NotificationImportance.WARNING }),
        ]);

        expect(notifications.length).toEqual(9);
        await expectIn({ type: NotificationType.UNREAD }, 9);
        let { overview } = await service.recalculateOverview();
        expect.soft(overview.unread.total).toEqual(9);
        expect.soft(overview.archive.total).toEqual(0);

        await service.archiveAll();
        await expectIn({ type: NotificationType.ARCHIVE }, 9);

        ({ overview } = await service.recalculateOverview());
        expect.soft(overview.unread.total).toEqual(0);
        expect.soft(overview.archive.total).toEqual(9);

        await service.unarchiveAll();
        await expectIn({ type: NotificationType.UNREAD }, 9);

        ({ overview } = await service.recalculateOverview());
        expect.soft(overview.unread.total).toEqual(9);
        expect.soft(overview.archive.total).toEqual(0);

        await service.archiveAll(importance);
        await expectIn({ type: NotificationType.ARCHIVE }, 3);
        await expectIn({ type: NotificationType.UNREAD }, 6);

        ({ overview } = await service.recalculateOverview());
        expect.soft(overview.unread.total).toEqual(6);
        expect.soft(overview.archive.total).toEqual(3);

        // archive another importance set, just to make sure unarchiveAll
        // isn't just ignoring the filter, which would be possible if it only
        // contained the stuff it was supposed to unarchive.

        const anotherImportance =
            importance === NotificationImportance.ALERT
                ? NotificationImportance.INFO
                : NotificationImportance.ALERT;
        await service.archiveAll(anotherImportance);
        await expectIn({ type: NotificationType.ARCHIVE }, 6);
        await expectIn({ type: NotificationType.UNREAD }, 3);

        ({ overview } = await service.recalculateOverview());
        expect.soft(overview.unread.total).toEqual(3);
        expect.soft(overview.archive.total).toEqual(6);

        await service.unarchiveAll(importance);
        await expectIn({ type: NotificationType.ARCHIVE }, 3);
        await expectIn({ type: NotificationType.UNREAD }, 6);

        ({ overview } = await service.recalculateOverview());
        expect.soft(overview.unread.total).toEqual(6);
        expect.soft(overview.archive.total).toEqual(3);
    });
});

describe.concurrent('NotificationsService legacy script compatibility', () => {
    let service: NotificationsService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NotificationsService],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    it.for([['normal'], ['warning'], ['alert']] as const)(
        'yields correct cli args for %ss',
        async ([importance], { expect }) => {
            const notification: NotificationIni = {
                event: 'Test Notification !@#$%^&*()_+={}[]|:;"\'<>,.?/~`',
                subject: 'Test Subject \t\n🚀💻🛠️',
                description: `Test Description with special characters \t\n©®™✓✓✓—“”‘’`,
                importance,
                link: 'https://unraid.net/?query=param&special=💡🔥✨',
                timestamp: new Date().toISOString(),
            };
            const [cmd, args] = service.getLegacyScriptArgs(notification);
            expect(args).toContain('-i');
            expect(args).toContain('-e');
            expect(args).toContain('-s');
            expect(args).toContain('-d');
            expect(args).toContain('-l');

            expect(args).toContain(notification.event);
            expect(args).toContain(notification.subject);
            expect(args).toContain(notification.description);
            expect(args).toContain(importance);
            expect(args).toContain(notification.link);

            const result = await execa(cmd, args, { reject: false });
            expect.soft(result.escapedCommand).toMatchSnapshot();

            if (result.failed) {
                // see https://github.com/sindresorhus/execa/blob/main/docs/errors.md#error-message
                //
                //* we use a snapshot because the script should only fail when it doesn't exist (ENOENT)
                expect(result.message).toMatchSnapshot();
            }
        }
    );
});
