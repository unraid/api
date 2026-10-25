import { ConfigService } from '@nestjs/config';
import { mkdir, mkdtemp, rm, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import type { FSWatcher } from 'chokidar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationType } from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

describe.sequential('Notification overview visibility', () => {
    let basePath: string;
    let service: NotificationsService;
    const file = (type: NotificationType, id: string) => join(basePath, type.toLowerCase(), id);

    async function write(type: NotificationType, id: string, importance = 'normal') {
        await writeFile(
            file(type, id),
            `timestamp=1700000000\nevent=Test\nsubject=Test\ndescription=Test\nimportance=${importance}\n`
        );
    }

    async function start(keepWatcher = false) {
        service = new NotificationsService(
            new ConfigService({ store: { dynamix: { notify: { path: basePath } } } })
        );
        await Reflect.get(service, 'initialization');
        if (!keepWatcher) await stopWatcher();
    }

    async function stopWatcher() {
        const watcher: FSWatcher | null = Reflect.get(NotificationsService, 'watcher');
        await watcher?.close();
        Reflect.set(NotificationsService, 'watcher', null);
    }

    async function add(type: NotificationType, id: string) {
        await Reflect.get(service, 'handleNotificationAdd').call(service, file(type, id));
    }

    async function expectCounts(unread: number, archive: number) {
        const overview = service.getOverview();
        expect(overview.unread.total).toBe(unread);
        expect(overview.archive.total).toBe(archive);
        for (const type of Object.values(NotificationType)) {
            const notifications = await service.getNotifications({ type, offset: 0, limit: 100 });
            expect(overview[type.toLowerCase()].total).toBe(notifications.length);
        }
    }

    beforeEach(async () => {
        basePath = await mkdtemp(join(tmpdir(), 'notification-overview-'));
        await Promise.all(
            Object.values(NotificationType).map((type) => mkdir(join(basePath, type.toLowerCase())))
        );
    });

    afterEach(async () => {
        await stopWatcher();
        await Reflect.get(service, 'overviewRefresh');
        await rm(basePath, { recursive: true, force: true });
    });

    it('hydrates counts with the same duplicate filtering as the lists', async () => {
        for (const importance of ['normal', 'warning', 'alert']) {
            await write(NotificationType.UNREAD, `${importance}.notify`, importance);
            await write(NotificationType.ARCHIVE, `${importance}.notify`, importance);
            await write(NotificationType.ARCHIVE, `archived-${importance}.notify`, importance);
        }
        await start();
        await expectCounts(3, 3);
        expect(service.getOverview().archive).toEqual({ info: 1, warning: 1, alert: 1, total: 3 });
        await service.recalculateOverview();
        await expectCounts(3, 3);
    });

    it.each([NotificationType.UNREAD, NotificationType.ARCHIVE])(
        'handles legacy copies written %s first and repeated events',
        async (first) => {
            await start();
            const second =
                first === NotificationType.UNREAD ? NotificationType.ARCHIVE : NotificationType.UNREAD;
            await write(first, 'legacy.notify');
            await add(first, 'legacy.notify');
            await write(second, 'legacy.notify');
            await add(second, 'legacy.notify');
            await add(first, 'legacy.notify');
            await expectCounts(1, 0);
        }
    );

    it('archives over an existing legacy archive copy and restores it', async () => {
        await write(NotificationType.UNREAD, 'legacy.notify');
        await write(NotificationType.ARCHIVE, 'legacy.notify');
        await start();
        await service.archiveNotification({ id: 'legacy.notify' });
        await expectCounts(0, 1);
        await service.markAsUnread({ id: 'legacy.notify' });
        await expectCounts(1, 0);
    });

    it('reveals the archive copy when unread is deleted', async () => {
        await write(NotificationType.UNREAD, 'legacy.notify');
        await write(NotificationType.ARCHIVE, 'legacy.notify');
        await start();
        await service.deleteNotification({ id: 'legacy.notify', type: NotificationType.UNREAD });
        await expectCounts(0, 1);
    });

    it('does not decrement the archive count when a hidden copy is deleted', async () => {
        await write(NotificationType.UNREAD, 'legacy.notify');
        await write(NotificationType.ARCHIVE, 'legacy.notify');
        await start();
        await service.deleteNotification({ id: 'legacy.notify', type: NotificationType.ARCHIVE });
        await expectCounts(1, 0);
    });

    it('recounts both categories after bulk deletes', async () => {
        await write(NotificationType.UNREAD, 'legacy.notify');
        await write(NotificationType.ARCHIVE, 'legacy.notify');
        await start();
        await service.deleteNotifications(NotificationType.UNREAD);
        await expectCounts(0, 1);
        await service.deleteAllNotifications();
        await expectCounts(0, 0);
    });

    it('serializes snapshots and coalesces requests queued during a refresh', async () => {
        await start();
        const snapshot = Reflect.get(service, 'buildOverviewSnapshot').bind(service);
        const captured = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        let calls = 0;
        Reflect.set(service, 'buildOverviewSnapshot', async () => {
            calls++;
            const result = await snapshot();
            if (calls === 1) {
                captured.resolve();
                await release.promise;
            }
            return result;
        });
        const first = service.recalculateOverview();
        await captured.promise;
        await write(NotificationType.UNREAD, 'during-refresh.notify');
        const queued = Array.from({ length: 20 }, () => service.recalculateOverview());
        release.resolve();
        await Promise.all([first, ...queued]);
        expect(calls).toBe(2);
        await expectCounts(1, 0);
    });

    it('can refresh again after a snapshot failure', async () => {
        await start();
        const snapshot = Reflect.get(service, 'buildOverviewSnapshot');
        Reflect.set(service, 'buildOverviewSnapshot', () => Promise.reject(new Error('read failure')));
        await expect(service.recalculateOverview()).rejects.toThrow();
        Reflect.set(service, 'buildOverviewSnapshot', snapshot);
        await write(NotificationType.UNREAD, 'after-failure.notify');
        await service.recalculateOverview();
        await expectCounts(1, 0);
    });

    it('handles new events while draining adds queued during hydration', async () => {
        await start();
        Reflect.set(service, 'getNotificationsWatcher', async () => null);
        const snapshot = Reflect.get(service, 'buildOverviewSnapshot').bind(service);
        const processAdd = Reflect.get(service, 'processNotificationAdd').bind(service);
        let firstSnapshot = true;
        Reflect.set(service, 'buildOverviewSnapshot', async () => {
            const result = await snapshot();
            if (firstSnapshot) {
                firstSnapshot = false;
                await write(NotificationType.UNREAD, 'queued.notify');
                await add(NotificationType.UNREAD, 'queued.notify');
            }
            return result;
        });
        Reflect.set(service, 'processNotificationAdd', async (path: string) => {
            await processAdd(path);
            if (path.endsWith('/queued.notify')) {
                await write(NotificationType.UNREAD, 'late.notify');
                await add(NotificationType.UNREAD, 'late.notify');
            }
        });
        await Reflect.get(service, 'initializeNotificationsState').call(service, basePath);
        await expectCounts(2, 0);
    });

    it('tracks external writes and unlink events through the real watcher', async () => {
        await start(true);
        const watcher: FSWatcher = Reflect.get(NotificationsService, 'watcher');
        await new Promise<void>((resolve) => watcher.once('ready', resolve));
        await write(NotificationType.ARCHIVE, 'external.notify');
        await vi.waitFor(() => expect(service.getOverview().archive.total).toBe(1));
        await write(NotificationType.UNREAD, 'external.notify');
        await vi.waitFor(() =>
            expect(service.getOverview()).toMatchObject({ unread: { total: 1 }, archive: { total: 0 } })
        );
        await unlink(file(NotificationType.UNREAD, 'external.notify'));
        await vi.waitFor(() =>
            expect(service.getOverview()).toMatchObject({ unread: { total: 0 }, archive: { total: 1 } })
        );
        await expectCounts(0, 1);
    });
});
