import { ConfigService } from '@nestjs/config';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import type { FSWatcher } from 'chokidar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    NotificationImportance,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

// Native macOS watching drops events during rename bursts; polling observes every change.
vi.mock('@app/environment.js', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/environment.js')>()),
    CHOKIDAR_USEPOLLING: true,
}));

const { UNREAD, ARCHIVE } = NotificationType;
const COUNT = 120;

describe.sequential('bulk notification moves', () => {
    let basePath: string;
    let service: NotificationsService;
    let subscription: number;
    let overviewPublishes: number;
    let ids: string[];

    const file = (type: NotificationType, id: string) => join(basePath, type.toLowerCase(), id);

    beforeEach(async () => {
        basePath = await mkdtemp(join(tmpdir(), 'notification-bulk-'));
        await Promise.all(
            Object.values(NotificationType).map((type) => mkdir(join(basePath, type.toLowerCase())))
        );
        ids = Array.from({ length: COUNT }, (_, index) => `docker-update-${index}.notify`);
        for (const id of ids) {
            await writeFile(
                file(UNREAD, id),
                'timestamp=1700000000\nevent=Docker\nsubject=Update\ndescription=Update\nimportance=normal\n'
            );
            await copyFile(file(UNREAD, id), file(ARCHIVE, id));
        }
        subscription = await pubsub.subscribe(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, () => {
            overviewPublishes++;
        });
        service = new NotificationsService(
            new ConfigService({ store: { dynamix: { notify: { path: basePath } } } })
        );
        await Reflect.get(service, 'initialization');
        overviewPublishes = 0;
    });

    afterEach(async () => {
        const watcher: FSWatcher | null = Reflect.get(NotificationsService, 'watcher');
        await watcher?.close();
        Reflect.set(NotificationsService, 'watcher', null);
        await Reflect.get(service, 'overviewUpdate');
        await Reflect.get(service, 'warningsUpdate');
        pubsub.unsubscribe(subscription);
        await rm(basePath, { recursive: true, force: true });
    });

    it('archives every unread notification with a bounded number of overview broadcasts', async () => {
        const { overview } = await service.archiveAll();

        expect(await readdir(join(basePath, 'unread'))).toEqual([]);
        expect(overview.unread.total).toBe(0);
        expect(overview.archive.total).toBe(COUNT);
        expect(overviewPublishes).toBeLessThan(COUNT / 10);
    });

    it('moves the remaining ids when some ids in a bulk request are missing', async () => {
        const result = await service.archiveIds([...ids, 'missing.notify']);

        expect(result.successes).toBe(COUNT);
        expect(result.errors).toHaveLength(1);
        expect(service.getOverview().archive.total).toBe(COUNT);

        await service.unarchiveAll();
        expect(service.getOverview().unread.total).toBe(COUNT);
        expect(service.getOverview().archive.total).toBe(0);
    });

    it('leaves unread entries that cannot be loaded in place', async () => {
        const directory = 'directory.notify';
        await mkdir(file(UNREAD, directory));

        const result = await service.archiveIds([directory, ids[0]]);

        expect(result.successes).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(await readdir(join(basePath, 'unread'))).toContain(directory);
        expect(await readdir(join(basePath, 'archive'))).not.toContain(directory);
    });

    it('reports a reconciliation failure through the bulk mutation', async () => {
        const [id] = ids;
        const internal = service as unknown as {
            readNotificationCopy(id: string, type: NotificationType): Promise<unknown>;
        };
        const read = internal.readNotificationCopy.bind(service);
        const spy = vi.spyOn(internal, 'readNotificationCopy').mockImplementation((entry, type) => {
            if (entry === id && type === ARCHIVE) return Promise.reject(new Error('read failed'));
            return read(entry, type);
        });

        try {
            const resolver = new NotificationsResolver(service);
            await expect(resolver.archiveNotifications([id])).rejects.toThrow(
                'Bulk notification move did not complete'
            );
            expect(await readdir(join(basePath, 'unread'))).not.toContain(id);
        } finally {
            spy.mockRestore();
        }
    });

    it('still applies an external edit made right after the service moved the file', async () => {
        const [id] = ids;
        await service.archiveNotification({ id });
        await writeFile(
            file(ARCHIVE, id),
            'timestamp=1700000001\nevent=Docker\nsubject=Update\ndescription=Edited\nimportance=alert\n'
        );

        await vi.waitFor(() => expect(service.getOverview().archive.alert).toBe(1), {
            timeout: 10_000,
        });
        expect(service.getOverview().archive.total).toBe(1);
    }, 20_000);

    it('restores in bulk without announcing each restored notification', async () => {
        const added: string[] = [];
        const addedSubscription = await pubsub.subscribe(
            PUBSUB_CHANNEL.NOTIFICATION_ADDED,
            (payload: { notificationAdded: { id: string } }) => added.push(payload.notificationAdded.id)
        );
        const watcher: FSWatcher = Reflect.get(NotificationsService, 'watcher');
        let unreadAdds = 0;
        let unreadUnlinks = 0;
        let lastEventAt = Date.now();
        watcher.on('all', (event, path) => {
            lastEventAt = Date.now();
            if (!path.startsWith(join(basePath, 'unread'))) return;
            if (event === 'add') unreadAdds++;
            if (event === 'unlink') unreadUnlinks++;
        });
        try {
            await service.archiveAll();
            await vi.waitFor(() => expect(unreadUnlinks).toBe(COUNT), { timeout: 10_000 });
            await service.unarchiveAll();
            expect(service.getOverview().unread.total).toBe(COUNT);

            await vi.waitFor(() => expect(unreadAdds).toBe(COUNT), { timeout: 10_000 });
            await vi.waitFor(() => expect(Date.now() - lastEventAt).toBeGreaterThan(1_000), {
                timeout: 15_000,
                interval: 100,
            });
            await Reflect.get(service, 'overviewUpdate');
            expect(added).toEqual([]);

            const [id] = ids;
            await service.archiveNotification({ id });
            await vi.waitFor(() => expect(unreadUnlinks).toBe(COUNT + 1), { timeout: 10_000 });
            await service.markAsUnread({ id });
            await vi.waitFor(() => expect(added).toEqual([id]), { timeout: 10_000 });
        } finally {
            pubsub.unsubscribe(addedSubscription);
        }
    }, 30_000);

    it('restores archive-only notifications without overwriting newer unread copies', async () => {
        const [legacy, archived] = ids;
        await service.archiveNotification({ id: archived });
        await writeFile(
            file(UNREAD, legacy),
            'timestamp=1700000003\nevent=Docker\nsubject=Update\ndescription=Edited\nimportance=alert\n'
        );

        for (const importance of [NotificationImportance.INFO, undefined]) {
            const result = await service.unarchiveAll(importance);
            expect(result.errorOccurred).toBe(false);
        }

        expect(await readFile(file(UNREAD, legacy), 'utf8')).toContain('importance=alert');
        expect(await readdir(join(basePath, 'archive'))).toContain(legacy);
        expect(await readdir(join(basePath, 'unread'))).toContain(archived);
    });

    it('reports files that cannot be read while filtering a bulk move by importance', async () => {
        await mkdir(file(UNREAD, 'unreadable.notify'));

        const result = await service.archiveAll(NotificationImportance.INFO);

        expect(result.successes).toBe(COUNT);
        expect(result.errors).toHaveLength(1);
        expect(result.errorOccurred).toBe(true);
        await expect(
            new NotificationsResolver(service).archiveAll(NotificationImportance.INFO)
        ).rejects.toThrow();
    });

    it('does not fail a delete because an unrelated id in the same batch failed', async () => {
        const internal = service as unknown as {
            enqueueOverviewUpdate<T>(action: () => Promise<T>): Promise<T>;
            synchronizeNotifications(ids: Iterable<string>): Promise<unknown>;
            readNotificationCopy(id: string, type: NotificationType): Promise<unknown>;
        };
        const read = internal.readNotificationCopy.bind(service);
        const spy = vi
            .spyOn(internal, 'readNotificationCopy')
            .mockImplementation((id, type) =>
                id === 'unrelated.notify' ? Promise.reject(new Error('read failed')) : read(id, type)
            );
        const synchronize = internal.synchronizeNotifications.bind(service);
        let deletionJoined = false;
        const joinSpy = vi
            .spyOn(internal, 'synchronizeNotifications')
            .mockImplementation((requested: Iterable<string>) => {
                const list = [...requested];
                // Watcher events request one id at a time; only the deletion requests the whole folder.
                if (list.length === COUNT) deletionJoined = true;
                return synchronize(list);
            });
        let release: (() => void) | undefined;
        const blocker = internal.enqueueOverviewUpdate(
            () => new Promise<void>((resolve) => (release = resolve))
        );
        try {
            await vi.waitFor(() => expect(release).toBeDefined());
            const unrelated = synchronize(['unrelated.notify']);
            const deletion = service.deleteNotifications(ARCHIVE);
            await vi.waitFor(() => expect(deletionJoined).toBe(true));
            release?.();
            await blocker;
            await expect(deletion).resolves.toBeDefined();
            await expect(unrelated).resolves.toBeDefined();
        } finally {
            release?.();
            joinSpy.mockRestore();
            spy.mockRestore();
        }
    });
});
