import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import type { FSWatcher } from 'chokidar';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    Notification,
    NotificationImportance,
    NotificationOverview,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

const { UNREAD, ARCHIVE } = NotificationType;

describe.sequential('Notification filesystem and subscription integration', () => {
    let basePath: string;
    let service: NotificationsService;
    let config: ConfigService;
    let watcher: FSWatcher;
    let subscriptions: number[];
    let overviews: NotificationOverview[];
    let additions: Notification[];
    let warnings: Notification[][];
    let events: { event: string; path: string }[];
    const file = (type: NotificationType, id: string) => join(basePath, type.toLowerCase(), id);

    async function write(type: NotificationType, id: string, importance = 'normal') {
        await writeFile(
            file(type, id),
            `timestamp=1700000000\nevent=Test\nsubject=Test\ndescription=Test\nimportance=${importance}\n`
        );
    }

    async function start() {
        subscriptions.push(
            await pubsub.subscribe(
                PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW,
                (payload: { notificationsOverview: NotificationOverview }) =>
                    overviews.push(payload.notificationsOverview)
            )
        );
        subscriptions.push(
            await pubsub.subscribe(
                PUBSUB_CHANNEL.NOTIFICATION_ADDED,
                (payload: { notificationAdded: Notification }) =>
                    additions.push(payload.notificationAdded)
            )
        );
        subscriptions.push(
            await pubsub.subscribe(
                PUBSUB_CHANNEL.NOTIFICATION_WARNINGS_AND_ALERTS,
                (payload: { notificationsWarningsAndAlerts: Notification[] }) =>
                    warnings.push(payload.notificationsWarningsAndAlerts)
            )
        );
        service = new NotificationsService(config);
        await Reflect.get(service, 'initialization');
        watcher = Reflect.get(NotificationsService, 'watcher');
        watcher.on('all', (event, path) => events.push({ event, path }));
    }

    async function expectCounts(unread: number, archive: number) {
        await vi.waitFor(
            async () => {
                const overview = service.getOverview();
                expect(overview.unread.total).toBe(unread);
                expect(overview.archive.total).toBe(archive);
                for (const type of Object.values(NotificationType)) {
                    const notifications = await service.getNotifications({
                        type,
                        offset: 0,
                        limit: 1000,
                    });
                    const counts = overview[type.toLowerCase()];
                    expect(counts.total).toBe(notifications.length);
                    for (const importance of Object.values(NotificationImportance)) {
                        expect(counts[importance.toLowerCase()]).toBe(
                            notifications.filter(
                                (notification) => notification.importance === importance
                            ).length
                        );
                    }
                }
            },
            { timeout: 4000, interval: 20 }
        );
    }

    async function expectEvent(event: string, type: NotificationType, id: string) {
        await vi.waitFor(() => expect(events).toContainEqual({ event, path: file(type, id) }), {
            timeout: 4000,
        });
        events.splice(
            events.findIndex((entry) => entry.event === event && entry.path === file(type, id)),
            1
        );
        await Reflect.get(service, 'overviewUpdate');
    }

    beforeEach(async () => {
        basePath = await mkdtemp(join(tmpdir(), 'notification-integration-'));
        await Promise.all(
            Object.values(NotificationType).map((type) => mkdir(join(basePath, type.toLowerCase())))
        );
        config = new ConfigService({ store: { dynamix: { notify: { path: basePath } } } });
        subscriptions = [];
        overviews = [];
        additions = [];
        warnings = [];
        events = [];
    });

    afterEach(async () => {
        const activeWatcher: FSWatcher | null = Reflect.get(NotificationsService, 'watcher');
        await activeWatcher?.close();
        Reflect.set(NotificationsService, 'watcher', null);
        if (service) {
            await Reflect.get(service, 'overviewUpdate');
            await Reflect.get(service, 'warningsUpdate');
        }
        subscriptions.forEach((subscription) => pubsub.unsubscribe(subscription));
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        await rm(basePath, { recursive: true, force: true });
    });

    it('hydrates all severities and excludes legacy archive copies', async () => {
        for (const importance of ['normal', 'warning', 'alert']) {
            await write(UNREAD, `${importance}.notify`, importance);
            await write(ARCHIVE, `${importance}.notify`, importance);
            await write(ARCHIVE, `archived-${importance}.notify`, importance);
        }
        await start();
        await expectCounts(3, 3);
        expect(service.getOverview().archive).toEqual({ info: 1, warning: 1, alert: 1, total: 3 });
        expect(additions).toEqual([]);
        await service.recalculateOverview();
        await expectCounts(3, 3);
    });

    it('keeps handling real file changes after a runtime watcher error', async () => {
        await start();
        expect(() => watcher.emit('error', new Error('watch resource exhausted'))).not.toThrow();
        await write(UNREAD, 'after-error.notify', 'warning');
        await expectEvent('add', UNREAD, 'after-error.notify');
        await expectCounts(1, 0);
        await service.archiveNotification({ id: 'after-error.notify' });
        await expectCounts(0, 1);
    });

    it('recovers a failed directory initialization on the next public request', async () => {
        const blocked = join(basePath, 'blocked');
        await writeFile(blocked, 'not a directory');
        config.set('store.dynamix.notify.path', blocked);
        service = new NotificationsService(config);
        await expect(Reflect.get(service, 'initialization')).rejects.toThrow();
        await unlink(blocked);
        await expect(service.getNotifications({ type: UNREAD, offset: 0, limit: 10 })).resolves.toEqual(
            []
        );
        await writeFile(
            join(blocked, 'unread', 'recovered.notify'),
            'timestamp=1700000000\nevent=Test\nsubject=Test\ndescription=Test\nimportance=alert\n'
        );
        await vi.waitFor(() => expect(service.getOverview().unread.alert).toBe(1));
    });

    it.each([UNREAD, ARCHIVE])(
        'handles legacy files written %s first without recounting',
        async (first) => {
            await start();
            const recount = vi.spyOn(service, 'recalculateOverview');
            const second = first === UNREAD ? ARCHIVE : UNREAD;
            const initialOverview = structuredClone(overviews[0]);
            await write(first, 'legacy.notify', 'warning');
            await expectEvent('add', first, 'legacy.notify');
            await expectCounts(first === UNREAD ? 1 : 0, first === ARCHIVE ? 1 : 0);
            await copyFile(file(first, 'legacy.notify'), file(second, 'legacy.notify'));
            await expectEvent('add', second, 'legacy.notify');
            await expectCounts(1, 0);
            await vi.waitFor(() => expect(additions).toHaveLength(1));
            await vi.waitFor(() => expect(warnings.at(-1)).toHaveLength(1));
            expect(recount).not.toHaveBeenCalled();
            expect(overviews.at(-1)).toEqual(service.getOverview());
            expect(overviews[0]).toEqual(initialOverview);
        }
    );

    it('creates a notification through the public API and publishes its real file data', async () => {
        await start();
        const notification = await service.createNotification({
            title: 'Integration notification',
            subject: 'Disk status',
            description: 'Test warning',
            importance: NotificationImportance.WARNING,
        });
        expect(await readFile(file(UNREAD, notification.id), 'utf8')).toContain('importance=warning');
        await expectEvent('add', UNREAD, notification.id);
        await expectCounts(1, 0);
        await vi.waitFor(() => expect(additions).toHaveLength(1));
        expect(additions[0]).toMatchObject({
            id: notification.id,
            subject: 'Disk status',
            importance: NotificationImportance.WARNING,
        });
    });

    it('archives over a legacy copy, restores, and deletes without late watcher drift', async () => {
        await write(UNREAD, 'legacy.notify', 'alert');
        await write(ARCHIVE, 'legacy.notify', 'normal');
        await start();
        const recount = vi.spyOn(service, 'recalculateOverview');
        const archived = await service.archiveNotification({ id: 'legacy.notify' });
        expect(archived.type).toBe(ARCHIVE);
        expect(service.getOverview().archive.alert).toBe(1);
        await expectEvent('unlink', UNREAD, 'legacy.notify');
        await expectCounts(0, 1);
        await vi.waitFor(() => expect(warnings.at(-1)).toEqual([]));
        const restored = await service.markAsUnread({ id: 'legacy.notify' });
        expect(restored.type).toBe(UNREAD);
        expect(service.getOverview().unread.alert).toBe(1);
        await expectEvent('unlink', ARCHIVE, 'legacy.notify');
        await expectEvent('add', UNREAD, 'legacy.notify');
        await expectCounts(1, 0);
        await vi.waitFor(() => expect(additions).toHaveLength(1));
        expect(additions[0]).toMatchObject({
            id: 'legacy.notify',
            type: UNREAD,
            importance: NotificationImportance.ALERT,
        });
        await service.deleteNotification({ id: 'legacy.notify', type: UNREAD });
        await expectEvent('unlink', UNREAD, 'legacy.notify');
        await expectCounts(0, 0);
        await vi.waitFor(() => expect(warnings.at(-1)).toEqual([]));
        expect(recount).not.toHaveBeenCalled();
    });

    it('updates warning subscription content without changing counts or adding again', async () => {
        await start();
        await write(UNREAD, 'content.notify', 'warning');
        await expectEvent('add', UNREAD, 'content.notify');
        await vi.waitFor(() => expect(additions).toHaveLength(1));
        await writeFile(
            file(UNREAD, 'content.notify'),
            'timestamp=1700000000\nevent=Test\nsubject=Updated subject\ndescription=Updated description\nimportance=warning\n'
        );
        await expectEvent('change', UNREAD, 'content.notify');
        await vi.waitFor(() =>
            expect(warnings.at(-1)?.[0]).toMatchObject({
                subject: 'Updated subject',
                description: 'Updated description',
            })
        );
        await expectCounts(1, 0);
        expect(additions).toHaveLength(1);
    });

    it('tracks external overwrite renames and severity changes', async () => {
        await write(UNREAD, 'external.notify', 'warning');
        await write(ARCHIVE, 'external.notify', 'normal');
        await start();
        await rename(file(UNREAD, 'external.notify'), file(ARCHIVE, 'external.notify'));
        await expectEvent('unlink', UNREAD, 'external.notify');
        await expectCounts(0, 1);
        expect(service.getOverview().archive.warning).toBe(1);
        await write(ARCHIVE, 'external.notify', 'alert');
        await expectEvent('change', ARCHIVE, 'external.notify');
        await vi.waitFor(() => expect(service.getOverview().archive.alert).toBe(1));
        await expectCounts(0, 1);
        await rename(file(ARCHIVE, 'external.notify'), file(UNREAD, 'external.notify'));
        await expectEvent('add', UNREAD, 'external.notify');
        await expectCounts(1, 0);
    });

    it.each([UNREAD, ARCHIVE])('deletes a %s copy according to actual visibility', async (type) => {
        await write(UNREAD, 'legacy.notify', 'warning');
        await write(ARCHIVE, 'legacy.notify', 'alert');
        await start();
        await service.deleteNotification({ id: 'legacy.notify', type });
        await expectEvent('unlink', type, 'legacy.notify');
        await expectCounts(type === UNREAD ? 0 : 1, type === UNREAD ? 1 : 0);
        if (type === UNREAD) expect(service.getOverview().archive.alert).toBe(1);
    });

    it('handles external deletion of either legacy copy', async () => {
        await write(UNREAD, 'legacy.notify', 'warning');
        await write(ARCHIVE, 'legacy.notify', 'alert');
        await start();
        await unlink(file(UNREAD, 'legacy.notify'));
        await expectEvent('unlink', UNREAD, 'legacy.notify');
        await expectCounts(0, 1);
        expect(service.getOverview().archive.alert).toBe(1);
        await unlink(file(ARCHIVE, 'legacy.notify'));
        await expectEvent('unlink', ARCHIVE, 'legacy.notify');
        await expectCounts(0, 0);
    });

    it('archives/restores by importance, archives all, then clears both categories', async () => {
        for (const importance of ['normal', 'warning', 'alert']) {
            await write(UNREAD, `${importance}.notify`, importance);
            await write(ARCHIVE, `${importance}.notify`, importance);
        }
        await start();
        const recount = vi.spyOn(service, 'recalculateOverview');
        await service.archiveAll(NotificationImportance.WARNING);
        await expectCounts(2, 1);
        expect(service.getOverview().archive.warning).toBe(1);
        await service.unarchiveAll(NotificationImportance.WARNING);
        await expectCounts(3, 0);
        await service.archiveAll();
        await expectCounts(0, 3);
        await service.unarchiveAll();
        await expectCounts(3, 0);
        await service.deleteAllNotifications();
        await expectCounts(0, 0);
        expect(recount).not.toHaveBeenCalled();
    });

    it('reveals hidden archive files after a bulk unread delete', async () => {
        await write(UNREAD, 'legacy.notify', 'warning');
        await write(ARCHIVE, 'legacy.notify', 'alert');
        await start();
        await service.deleteNotifications(UNREAD);
        await expectEvent('unlink', UNREAD, 'legacy.notify');
        await expectCounts(0, 1);
        expect(service.getOverview().archive.alert).toBe(1);
    });

    it('reconciles cached IDs even when their unlink event has not arrived', async () => {
        await write(UNREAD, 'removed.notify');
        await start();
        await watcher.close();
        await unlink(file(UNREAD, 'removed.notify'));
        await service.deleteNotifications(UNREAD);
        await expectCounts(0, 0);
    });

    it('handles a burst of legacy writes without full recounts or duplicate additions', async () => {
        await start();
        const recount = vi.spyOn(service, 'recalculateOverview');
        const ids = Array.from({ length: 24 }, (_, index) => `burst-${index}.notify`);
        await Promise.all(
            ids.map(async (id) => {
                await write(UNREAD, id, 'warning');
                await copyFile(file(UNREAD, id), file(ARCHIVE, id));
            })
        );
        await expectCounts(24, 0);
        await vi.waitFor(() => expect(additions).toHaveLength(24));
        await vi.waitFor(() => expect(events.filter((entry) => entry.event === 'add')).toHaveLength(48));
        await Reflect.get(service, 'overviewUpdate');
        await expectCounts(24, 0);
        expect(new Set(additions.map((notification) => notification.id)).size).toBe(24);
        await vi.waitFor(() => expect(warnings.at(-1)).toHaveLength(1));
        expect(recount).not.toHaveBeenCalled();
    });

    it('bounds event reads to affected files even with a large archived history', async () => {
        await Promise.all(
            Array.from({ length: 128 }, (_, index) => write(ARCHIVE, `history-${index}.notify`))
        );
        await start();
        const recount = vi.spyOn(service, 'recalculateOverview');
        const reads: string[] = [];
        const load = Reflect.get(service, 'loadNotificationFile').bind(service);
        Reflect.set(service, 'loadNotificationFile', (path: string, type: NotificationType) => {
            reads.push(path);
            return load(path, type);
        });
        await write(UNREAD, 'new.notify');
        await copyFile(file(UNREAD, 'new.notify'), file(ARCHIVE, 'new.notify'));
        await expectEvent('add', UNREAD, 'new.notify');
        await expectEvent('add', ARCHIVE, 'new.notify');
        await vi.waitFor(() =>
            expect(service.getOverview()).toMatchObject({
                unread: { total: 1 },
                archive: { total: 128 },
            })
        );
        expect(recount).not.toHaveBeenCalled();
        expect(reads.some((path) => path.includes('/history-'))).toBe(false);
        await expectCounts(1, 128);
    });

    it('retains the previous counts when an explicit reconciliation cannot read a category', async () => {
        await write(UNREAD, 'visible.notify');
        await start();
        await watcher.close();
        const unread = file(UNREAD, '');
        const saved = join(basePath, 'saved-unread');
        await rename(unread, saved);
        try {
            const before = service.getOverview();
            const result = await service.recalculateOverview();
            expect(result.error).toBe(true);
            expect(service.getOverview()).toEqual(before);
        } finally {
            await rename(saved, unread);
        }
        await service.recalculateOverview();
        await expectCounts(1, 0);
    });

    it('keeps counts intact after a failed rename and allows a successful retry', async () => {
        await write(UNREAD, 'blocked.notify', 'warning');
        await start();
        await mkdir(file(ARCHIVE, 'blocked.notify'));
        await expect(service.archiveNotification({ id: 'blocked.notify' })).rejects.toThrow();
        await expectCounts(1, 0);
        await rm(file(ARCHIVE, 'blocked.notify'), { recursive: true });
        await service.archiveNotification({ id: 'blocked.notify' });
        await expectEvent('unlink', UNREAD, 'blocked.notify');
        await expectCounts(0, 1);
    });

    it('replays real watcher changes after an in-flight full reconciliation', async () => {
        await write(UNREAD, 'removed.notify');
        await start();
        const original = Reflect.get(service, 'buildOverviewSnapshot').bind(service);
        const captured = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        Reflect.set(service, 'buildOverviewSnapshot', async () => {
            const result = await original();
            captured.resolve();
            await release.promise;
            return result;
        });
        const reconciliation = service.recalculateOverview();
        try {
            await captured.promise;
            await write(UNREAD, 'added.notify', 'alert');
            await unlink(file(UNREAD, 'removed.notify'));
            await vi.waitFor(
                () => {
                    expect(events).toContainEqual({ event: 'add', path: file(UNREAD, 'added.notify') });
                    expect(events).toContainEqual({
                        event: 'unlink',
                        path: file(UNREAD, 'removed.notify'),
                    });
                },
                { timeout: 4000 }
            );
        } finally {
            release.resolve();
            await reconciliation;
        }
        await Reflect.get(service, 'overviewUpdate');
        await expectCounts(1, 0);
        expect(service.getOverview().unread.alert).toBe(1);
        expect(overviews.at(-1)).toEqual(service.getOverview());
    });

    it('replays actual adds and removals that arrive during the startup snapshot', async () => {
        await write(UNREAD, 'old.notify');
        await write(ARCHIVE, 'old.notify', 'warning');
        const prototype = NotificationsService.prototype;
        const snapshot = Reflect.get(prototype, 'buildOverviewSnapshot');
        const release = Promise.withResolvers<void>();
        let captured = false;
        Reflect.set(prototype, 'buildOverviewSnapshot', async function (this: NotificationsService) {
            const result = await snapshot.call(this);
            captured = true;
            await release.promise;
            return result;
        });
        const starting = start();
        try {
            await vi.waitFor(() => expect(captured).toBe(true));
            const activeWatcher: FSWatcher = Reflect.get(NotificationsService, 'watcher');
            const duringStartup: string[] = [];
            activeWatcher.on('all', (event, path) => duringStartup.push(`${event}:${path}`));
            await write(UNREAD, 'during-startup.notify', 'alert');
            await unlink(file(UNREAD, 'old.notify'));
            await vi.waitFor(() => {
                expect(duringStartup).toContain(`add:${file(UNREAD, 'during-startup.notify')}`);
                expect(duringStartup).toContain(`unlink:${file(UNREAD, 'old.notify')}`);
            });
            await writeFile(
                file(UNREAD, 'during-startup.notify'),
                'timestamp=1700000000\nevent=Test\nsubject=Startup update\ndescription=Test\nimportance=alert\n'
            );
            await vi.waitFor(() =>
                expect(duringStartup).toContain(`change:${file(UNREAD, 'during-startup.notify')}`)
            );
        } finally {
            release.resolve();
            await starting;
            Reflect.set(prototype, 'buildOverviewSnapshot', snapshot);
        }
        await expectCounts(1, 1);
        expect(service.getOverview().unread.alert).toBe(1);
        expect(service.getOverview().archive.warning).toBe(1);
        await vi.waitFor(() => expect(additions).toHaveLength(1));
        expect(additions[0]).toMatchObject({ id: 'during-startup.notify', subject: 'Startup update' });
    });

    it('rebuilds the index and watcher when the configured directory changes', async () => {
        await write(UNREAD, 'old.notify');
        await start();
        const previousWatcher = watcher;
        const next = join(basePath, 'alternate');
        await Promise.all(
            Object.values(NotificationType).map((type) =>
                mkdir(join(next, type.toLowerCase()), { recursive: true })
            )
        );
        const nextFile = join(next, 'archive', 'new.notify');
        await writeFile(
            nextFile,
            'timestamp=1700000000\nevent=Test\nsubject=Test\ndescription=Test\nimportance=alert\n'
        );
        config.set('store.dynamix.notify.path', next);
        await service.getNotifications({ type: ARCHIVE, offset: 0, limit: 100 });
        expect(Object.keys(previousWatcher.getWatched())).toHaveLength(0);
        await expectCounts(0, 1);
        expect(service.getOverview().archive.alert).toBe(1);
        watcher = Reflect.get(NotificationsService, 'watcher');
        const removed = new Promise<void>((resolve) => watcher.once('unlink', () => resolve()));
        await unlink(nextFile);
        await removed;
        await expectCounts(0, 0);
    });

    it('recovers a failed startup replay on the next public request', async () => {
        const prototype = NotificationsService.prototype;
        const snapshot = Reflect.get(prototype, 'buildOverviewSnapshot');
        const handler = Reflect.get(prototype, 'handleNotificationEvent');
        const captured = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        let failReplay = true;
        Reflect.set(prototype, 'buildOverviewSnapshot', async function (this: NotificationsService) {
            const result = await snapshot.call(this);
            captured.resolve();
            await release.promise;
            return result;
        });
        Reflect.set(
            prototype,
            'handleNotificationEvent',
            async function (this: NotificationsService, path: string, event: string) {
                if (
                    failReplay &&
                    path.endsWith('/replay.notify') &&
                    !Reflect.get(this, 'isHydratingOverview')
                ) {
                    failReplay = false;
                    throw new Error('replay read failed');
                }
                return handler.call(this, path, event);
            }
        );
        const rejected = expect(start()).rejects.toThrow();
        try {
            await captured.promise;
            const activeWatcher: FSWatcher = Reflect.get(NotificationsService, 'watcher');
            const added = new Promise<void>((resolve) => activeWatcher.once('add', () => resolve()));
            await write(UNREAD, 'replay.notify', 'alert');
            await added;
            release.resolve();
            await rejected;
            expect(failReplay).toBe(false);
            await expect(
                service.getNotifications({ type: UNREAD, offset: 0, limit: 10 })
            ).resolves.toHaveLength(1);
            await expectCounts(1, 0);
        } finally {
            release.resolve();
            Reflect.set(prototype, 'buildOverviewSnapshot', snapshot);
            Reflect.set(prototype, 'handleNotificationEvent', handler);
        }
    });

    it('returns matching lists and counts through actual GraphQL queries and mutations', async () => {
        await write(UNREAD, 'graphql.notify', 'warning');
        await write(ARCHIVE, 'graphql.notify', 'warning');
        await start();
        vi.stubGlobal('getServerIdentifier', () => 'integration');
        const module = await Test.createTestingModule({
            imports: [
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                }),
            ],
            providers: [
                PrefixedID,
                NotificationsResolver,
                { provide: NotificationsService, useValue: service },
            ],
        }).compile();
        const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        try {
            await app.init();
            await app.getHttpAdapter().getInstance().ready();
            const execute = async (query: string) => {
                const response = await app.inject({
                    method: 'POST',
                    url: '/graphql',
                    payload: { query },
                });
                expect(response.statusCode).toBe(200);
                const result = response.json<{ data: unknown; errors?: unknown[] }>();
                expect(result.errors).toBeUndefined();
                return result.data;
            };
            expect(
                await execute(
                    '{ notifications { overview { unread { total } archive { total } } list(filter: {type: ARCHIVE, offset: 0, limit: 100}) { id } } }'
                )
            ).toEqual({
                notifications: { overview: { unread: { total: 1 }, archive: { total: 0 } }, list: [] },
            });
            expect(
                await execute(
                    'mutation { archiveNotification(id: "integration:graphql.notify") { id type } }'
                )
            ).toEqual({ archiveNotification: { id: 'integration:graphql.notify', type: ARCHIVE } });
            await expectEvent('unlink', UNREAD, 'graphql.notify');
            expect(
                await execute(
                    '{ notifications { overview { unread { total } archive { total } } list(filter: {type: ARCHIVE, offset: 0, limit: 100}) { id importance } } }'
                )
            ).toEqual({
                notifications: {
                    overview: { unread: { total: 0 }, archive: { total: 1 } },
                    list: [
                        { id: 'integration:graphql.notify', importance: NotificationImportance.WARNING },
                    ],
                },
            });
            expect(
                await execute(
                    'mutation { unreadNotification(id: "integration:graphql.notify") { type } }'
                )
            ).toEqual({ unreadNotification: { type: UNREAD } });
            await expectEvent('add', UNREAD, 'graphql.notify');
            await expectCounts(1, 0);
        } finally {
            await app.close();
        }
    });
});
