import { ConfigService } from '@nestjs/config';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import type { FSWatcher } from 'chokidar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import {
    Notification,
    NotificationImportance,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

describe.sequential('Warning and alert refresh scheduling', () => {
    let basePath: string;
    let service: NotificationsService;
    let subscription: number;
    let snapshots: Notification[][];
    const pending: Promise<void>[] = [];
    const gates: (() => void)[] = [];

    const write = (importance: string) =>
        writeFile(
            join(basePath, 'unread', 'current.notify'),
            `timestamp=1700000000\nevent=Test\nsubject=Test\ndescription=Test\nimportance=${importance}\n`
        );
    function refresh(): Promise<void> {
        const result = Reflect.get(service, 'publishWarningsAndAlerts').call(service);
        pending.push(result);
        return result;
    }
    function gate() {
        const result = Promise.withResolvers<void>();
        gates.push(result.resolve);
        return result;
    }

    beforeEach(async () => {
        basePath = await mkdtemp(join(tmpdir(), 'notification-broadcast-'));
        await mkdir(join(basePath, 'unread'));
        await mkdir(join(basePath, 'archive'));
        await write('warning');
        service = new NotificationsService(
            new ConfigService({ store: { dynamix: { notify: { path: basePath } } } })
        );
        await Reflect.get(service, 'initialization');
        const watcher: FSWatcher = Reflect.get(NotificationsService, 'watcher');
        await watcher.close();
        Reflect.set(NotificationsService, 'watcher', null);
        snapshots = [];
        subscription = await pubsub.subscribe(
            PUBSUB_CHANNEL.NOTIFICATION_WARNINGS_AND_ALERTS,
            (payload: { notificationsWarningsAndAlerts: Notification[] }) =>
                snapshots.push(payload.notificationsWarningsAndAlerts)
        );
    });

    afterEach(async () => {
        gates.splice(0).forEach((release) => release());
        await Promise.allSettled(pending.splice(0));
        pubsub.unsubscribe(subscription);
        vi.restoreAllMocks();
        await rm(basePath, { recursive: true, force: true });
    });

    it('combines simultaneous refresh requests into one real payload read', async () => {
        const scans = vi.spyOn(service, 'getWarningsAndAlerts');
        await Promise.all(Array.from({ length: 100 }, refresh));
        expect(scans).toHaveBeenCalledTimes(1);
        expect(snapshots).toHaveLength(1);
        expect(snapshots[0][0].importance).toBe(NotificationImportance.WARNING);
    });

    it('serializes a mid-read burst and publishes the latest disk state afterward', async () => {
        const captured = gate();
        const release = gate();
        const read = service.getWarningsAndAlerts.bind(service);
        let active = 0;
        let peak = 0;
        const scans = vi.spyOn(service, 'getWarningsAndAlerts').mockImplementation(async () => {
            active++;
            peak = Math.max(peak, active);
            try {
                const snapshot = await read();
                if (!snapshots.length) {
                    captured.resolve();
                    await release.promise;
                }
                return snapshot;
            } finally {
                active--;
            }
        });
        refresh();
        await captured.promise;
        await write('alert');
        Array.from({ length: 100 }, refresh);
        release.resolve();
        await Promise.all(pending);
        expect(peak).toBe(1);
        expect(scans).toHaveBeenCalledTimes(2);
        expect(snapshots.at(-1)?.[0].importance).toBe(NotificationImportance.ALERT);
    });

    it('keeps a request received during a failed scan and accepts later requests', async () => {
        const captured = gate();
        const release = gate();
        const scans = vi.spyOn(service, 'getWarningsAndAlerts').mockImplementationOnce(async () => {
            captured.resolve();
            await release.promise;
            throw new Error('temporary notification read failure');
        });
        const logger = Reflect.get(service, 'logger');
        const errors = vi.spyOn(logger, 'error');
        refresh();
        await captured.promise;
        await write('alert');
        refresh();
        release.resolve();
        await Promise.all(pending);
        expect(scans).toHaveBeenCalledTimes(2);
        expect(errors).toHaveBeenCalled();
        expect(snapshots.at(-1)?.[0].importance).toBe(NotificationImportance.ALERT);
        await write('warning');
        await refresh();
        expect(scans).toHaveBeenCalledTimes(3);
        expect(snapshots.at(-1)?.[0].importance).toBe(NotificationImportance.WARNING);
    });

    it('does not lose refresh requests received while publication is pending', async () => {
        const captured = gate();
        const release = gate();
        const publish = pubsub.publish.bind(pubsub);
        vi.spyOn(pubsub, 'publish').mockImplementationOnce(async (channel, payload) => {
            captured.resolve();
            await release.promise;
            return publish(channel, payload);
        });
        const scans = vi.spyOn(service, 'getWarningsAndAlerts');
        refresh();
        await captured.promise;
        await write('alert');
        Array.from({ length: 100 }, refresh);
        release.resolve();
        await Promise.all(pending);
        expect(scans).toHaveBeenCalledTimes(2);
        expect(snapshots.at(-1)?.[0].importance).toBe(NotificationImportance.ALERT);
    });

    it.each(['read', 'publication'] as const)(
        'releases the scheduler after a %s failure with no pending request',
        async (failure) => {
            if (failure === 'read') {
                vi.spyOn(service, 'getWarningsAndAlerts').mockRejectedValueOnce(
                    new Error('read failed')
                );
            } else {
                vi.spyOn(pubsub, 'publish').mockRejectedValueOnce(new Error('publication failed'));
            }
            await refresh();
            expect(snapshots).toEqual([]);
            await write('alert');
            await refresh();
            expect(snapshots).toHaveLength(1);
            expect(snapshots[0][0].importance).toBe(NotificationImportance.ALERT);
        }
    );
});
