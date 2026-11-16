import { ConfigService } from '@nestjs/config';
import { copyFile, mkdir, mkdtemp, rm, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, join } from 'path';

import type { FSWatcher } from 'chokidar';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    Notification,
    NotificationImportance,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

const { UNREAD, ARCHIVE } = NotificationType;

describe.sequential('Notification burst read costs', () => {
    let basePath: string;
    let service: NotificationsService;
    let watcher: FSWatcher;
    const subscriptions: number[] = [];
    const handlers: Promise<unknown>[] = [];
    const publications: Promise<unknown>[] = [];

    afterEach(async () => {
        await watcher?.close();
        Reflect.set(NotificationsService, 'watcher', null);
        await Promise.allSettled(handlers.splice(0));
        await Promise.allSettled(publications.splice(0));
        subscriptions.splice(0).forEach((id) => pubsub.unsubscribe(id));
        vi.restoreAllMocks();
        if (basePath) await rm(basePath, { recursive: true, force: true });
    });

    for (const [historySize, burstSize] of [
        [0, 24],
        [1000, 24],
        [1000, 100],
    ]) {
        it.each(['create', 'change', 'repeated-change', 'delete', 'archive-only'] as const)(
            `measures ${burstSize} %s operations with ${historySize} unread and archived history files`,
            async (operation) => {
                basePath = await mkdtemp(join(tmpdir(), 'notification-load-'));
                const path = (type: NotificationType, id: string) =>
                    join(basePath, type.toLowerCase(), id);
                const write = (type: NotificationType, id: string, importance = 'normal') =>
                    writeFile(
                        path(type, id),
                        `timestamp=1700000000\nevent=${id}\nsubject=Load\ndescription=Load\nimportance=${importance}\n`
                    );
                await Promise.all([mkdir(path(UNREAD, '')), mkdir(path(ARCHIVE, ''))]);
                for (const type of [UNREAD, ARCHIVE]) {
                    await Promise.all(
                        Array.from({ length: historySize }, (_, index) =>
                            write(type, `${type.toLowerCase()}-history-${index}.notify`)
                        )
                    );
                }
                const ids = Array.from({ length: burstSize }, (_, index) => `burst-${index}.notify`);
                const changesExisting = operation === 'change' || operation === 'repeated-change';
                if (changesExisting || operation === 'delete') {
                    await Promise.all(
                        ids.map(async (id) => {
                            await write(UNREAD, id);
                            await write(ARCHIVE, id, 'alert');
                        })
                    );
                }

                service = new NotificationsService(
                    new ConfigService({ store: { dynamix: { notify: { path: basePath } } } })
                );
                await Reflect.get(service, 'initialization');
                watcher = Reflect.get(NotificationsService, 'watcher');
                // Measure a fixed handler workload. OS watchers can split or coalesce file writes.
                // Real watcher delivery is covered by notifications.overview.spec.ts.
                await watcher.close();
                Reflect.set(NotificationsService, 'watcher', null);
                const reads: string[] = [];
                const events: { kind: string; path: string }[] = [];
                const failures: unknown[] = [];
                const snapshots: Notification[][] = [];
                const additions: Notification[] = [];
                subscriptions.push(
                    await pubsub.subscribe(
                        PUBSUB_CHANNEL.NOTIFICATION_WARNINGS_AND_ALERTS,
                        (payload: { notificationsWarningsAndAlerts: Notification[] }) =>
                            snapshots.push(payload.notificationsWarningsAndAlerts)
                    ),
                    await pubsub.subscribe(
                        PUBSUB_CHANNEL.NOTIFICATION_ADDED,
                        (payload: { notificationAdded: Notification }) =>
                            additions.push(payload.notificationAdded)
                    )
                );
                const load = Reflect.get(service, 'loadNotificationFile').bind(service);
                Reflect.set(service, 'loadNotificationFile', (file: string, type: NotificationType) => {
                    reads.push(file);
                    return load(file, type);
                });
                const handle: (file: string, kind: string) => Promise<void> = Reflect.get(
                    service,
                    'handleNotificationEvent'
                ).bind(service);
                const publish = Reflect.get(service, 'publishWarningsAndAlerts').bind(service);
                Reflect.set(service, 'publishWarningsAndAlerts', () => {
                    const pending = publish();
                    publications.push(pending);
                    return pending;
                });
                let activeScans = 0;
                let peakActiveScans = 0;
                const readWarnings = service.getWarningsAndAlerts.bind(service);
                const scans = vi.spyOn(service, 'getWarningsAndAlerts').mockImplementation(async () => {
                    activeScans++;
                    peakActiveScans = Math.max(peakActiveScans, activeScans);
                    try {
                        return await readWarnings();
                    } finally {
                        activeScans--;
                    }
                });
                const recount = vi.spyOn(service, 'recalculateOverview');
                const started = performance.now();
                await Promise.all(
                    ids.map(async (id) => {
                        switch (operation) {
                            case 'create':
                                await write(UNREAD, id, 'warning');
                                await copyFile(path(UNREAD, id), path(ARCHIVE, id));
                                events.push(
                                    { kind: 'add', path: path(UNREAD, id) },
                                    { kind: 'add', path: path(ARCHIVE, id) }
                                );
                                break;
                            case 'change':
                            case 'repeated-change':
                                await write(UNREAD, id, 'warning');
                                events.push({ kind: 'change', path: path(UNREAD, id) });
                                if (operation === 'repeated-change') {
                                    events.push({ kind: 'change', path: path(UNREAD, id) });
                                }
                                break;
                            case 'delete':
                                await unlink(path(UNREAD, id));
                                events.push({ kind: 'unlink', path: path(UNREAD, id) });
                                break;
                            case 'archive-only':
                                await write(ARCHIVE, id, 'warning');
                                events.push({ kind: 'add', path: path(ARCHIVE, id) });
                                break;
                        }
                    })
                );
                const expectedEvents =
                    burstSize * (operation === 'create' || operation === 'repeated-change' ? 2 : 1);
                for (const event of events) {
                    handlers.push(
                        handle(event.path, event.kind).catch((error: unknown) => failures.push(error))
                    );
                }
                await Promise.all(handlers);
                await Promise.all(publications);
                const elapsedMs = performance.now() - started;
                const measuredReads = [...reads];
                expect(failures).toEqual([]);
                expect(recount).not.toHaveBeenCalled();
                expect(
                    measuredReads.filter((file) => basename(file).startsWith('archive-history-'))
                ).toEqual([]);
                const unreadEvents = events.filter((event) => event.path.includes('/unread/'));
                expect(scans.mock.calls.length).toBeLessThanOrEqual(unreadEvents.length);
                expect(peakActiveScans).toBeLessThanOrEqual(1);
                if (historySize) expect(scans.mock.calls.length).toBeLessThanOrEqual(4);
                const maximumUnread = historySize + (operation === 'archive-only' ? 0 : burstSize);
                expect(measuredReads.length).toBeLessThanOrEqual(
                    2 * expectedEvents + maximumUnread * scans.mock.calls.length
                );
                const unreadTotal =
                    historySize +
                    (operation === 'delete' || operation === 'archive-only' ? 0 : burstSize);
                const archiveTotal =
                    historySize +
                    (operation === 'delete' || operation === 'archive-only' ? burstSize : 0);
                expect(service.getOverview()).toMatchObject({
                    unread: {
                        total: unreadTotal,
                        warning: operation === 'create' || changesExisting ? burstSize : 0,
                    },
                    archive: { total: archiveTotal, alert: operation === 'delete' ? burstSize : 0 },
                });
                if (unreadEvents.length) {
                    expect(snapshots.length).toBeGreaterThan(0);
                    const latest = snapshots.at(-1) ?? [];
                    expect(latest).toHaveLength(operation === 'delete' ? 0 : Math.min(burstSize, 50));
                    for (const notification of latest) {
                        expect(ids).toContain(notification.id);
                        expect(notification.importance).toBe(NotificationImportance.WARNING);
                    }
                } else {
                    expect(scans).not.toHaveBeenCalled();
                    expect(snapshots).toEqual([]);
                }
                expect(additions).toHaveLength(operation === 'create' ? burstSize : 0);
                expect(new Set(additions.map((notification) => notification.id)).size).toBe(
                    additions.length
                );

                // Ground-truth list reads are deliberately outside the measured event workload.
                for (const type of [UNREAD, ARCHIVE]) {
                    const list = await service.getNotifications({ type, offset: 0, limit: 10000 });
                    const counts = service.getOverview()[type.toLowerCase()];
                    expect(counts.total).toBe(list.length);
                    for (const importance of Object.values(NotificationImportance)) {
                        expect(counts[importance.toLowerCase()]).toBe(
                            list.filter((notification) => notification.importance === importance).length
                        );
                    }
                }
                console.info(
                    'notification-load',
                    JSON.stringify({
                        operation,
                        historySize,
                        burstSize,
                        events: events.length,
                        fileReadAttempts: measuredReads.length,
                        warningScans: scans.mock.calls.length,
                        peakActiveScans,
                        elapsedMs: Math.round(elapsedMs),
                    })
                );
            },
            60000
        );
    }
});
