import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';

import type { Stats } from 'fs';
import { FSWatcher, watch } from 'chokidar';
import { ValidationError } from 'class-validator';
import { execa } from 'execa';
import { emptyDir } from 'fs-extra';
import { decode } from 'html-entities';
import { encode as encodeIni } from 'ini';
import { v7 as uuidv7 } from 'uuid';

import { AppError } from '@app/core/errors/app-error.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { NotificationIni } from '@app/core/types/states/notification.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { resolveFileInDirectory } from '@app/core/utils/files/resolve-file-in-directory.js';
import { parseConfig } from '@app/core/utils/misc/parse-config.js';
import { CHOKIDAR_USEPOLLING } from '@app/environment.js';
import { getters } from '@app/store/index.js';
import {
    Notification,
    NotificationCounts,
    NotificationData,
    NotificationFilter,
    NotificationImportance,
    NotificationOverview,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { validateObject } from '@app/unraid-api/graph/resolvers/validation.utils.js';
import { SortFn } from '@app/unraid-api/types/util.js';
import { batchProcess, formatDatetime, isFulfilled, isRejected, unraidTimestamp } from '@app/utils.js';

type NotificationFileState = Partial<Record<NotificationType, NotificationImportance>>;
type NotificationFileEvent = 'add' | 'change' | 'unlink';

@Injectable()
export class NotificationsService {
    private static readonly FILE_IO_BATCH_SIZE = 32;
    private logger = new Logger(NotificationsService.name);
    private static watcher: FSWatcher | null = null;
    /**
     * The path to the notification directory - will be updated if the user changes the notifier path
     */
    private path: string | null = null;
    private initialization: Promise<void> | null = null;
    private initializationFailed = false;
    private overviewUpdate: Promise<unknown> = Promise.resolve();
    private warningsUpdate: Promise<void> | null = null;
    private warningsUpdateRequested = false;
    private notificationFiles = new Map<string, NotificationFileState>();
    private isHydratingOverview = false;
    private pendingNotificationEvents = new Map<string, NotificationFileEvent>();

    private static overview: NotificationOverview = {
        unread: {
            alert: 0,
            info: 0,
            warning: 0,
            total: 0,
        },
        archive: {
            alert: 0,
            info: 0,
            warning: 0,
            total: 0,
        },
    };

    constructor(private readonly configService: ConfigService) {
        this.path = this.getConfiguredPath();
        this.initialization = this.initializeNotificationsState(this.path);
    }

    private getConfiguredPath() {
        return this.configService.get<string>('store.dynamix.notify.path', '/tmp/notifications');
    }

    /**
     * Returns the paths to the notification directories.
     *
     * @returns an object with the:
     *          - base path
     *          - path to the unread notifications
     *          - path to the archived notifications
     */
    public paths(): Record<'basePath' | NotificationType, string> {
        const basePath = this.getConfiguredPath();

        if (this.path !== basePath) {
            this.path = basePath;
            this.initialization = this.initializeNotificationsState(basePath, true);
        }

        const makePath = (type: NotificationType) => join(basePath, type.toLowerCase());
        return {
            basePath,
            [NotificationType.UNREAD]: makePath(NotificationType.UNREAD),
            [NotificationType.ARCHIVE]: makePath(NotificationType.ARCHIVE),
        };
    }

    private async waitForInitialization() {
        this.paths();
        if (this.initializationFailed) {
            this.initialization = this.initializeNotificationsState(this.getConfiguredPath(), true);
        }
        await this.initialization;
    }

    private notificationPath(id: string, type: NotificationType): string {
        return resolveFileInDirectory(this.paths()[type], id);
    }

    private initializeNotificationsState(basePath: string, recreate = false) {
        this.initializationFailed = false;
        const initialize = async () => {
            await this.ensureNotificationDirectories(basePath);
            this.pendingNotificationEvents.clear();
            this.isHydratingOverview = true;

            try {
                await this.getNotificationsWatcher(basePath, recreate);
                const { error: errorOccurred } = await this.reconcileOverview();
                const pendingEvents = [...this.pendingNotificationEvents];
                this.pendingNotificationEvents.clear();
                this.isHydratingOverview = false;

                for (const [path, event] of pendingEvents) {
                    await this.handleNotificationEvent(path, event);
                }

                if (errorOccurred) {
                    this.logger.error(
                        '[initializeNotificationsState] Failed to fully hydrate notification overview'
                    );
                }
            } finally {
                this.isHydratingOverview = false;
                this.pendingNotificationEvents.clear();
            }
        };

        const previousInitialization = this.initialization ?? Promise.resolve();
        const initialization = previousInitialization.catch(() => undefined).then(initialize);
        void initialization.catch((error) => {
            if (this.initialization === initialization) this.initializationFailed = true;
            this.logger.error(error);
        });
        return initialization;
    }

    private async ensureNotificationDirectories(basePath: string) {
        await Promise.all([
            mkdir(basePath, { recursive: true }),
            mkdir(join(basePath, NotificationType.UNREAD.toLowerCase()), {
                recursive: true,
            }),
            mkdir(join(basePath, NotificationType.ARCHIVE.toLowerCase()), {
                recursive: true,
            }),
        ]);
    }

    /**------------------------------------------------------------------------
     *                           Subscription Events
     *
     * Sets up a notification watcher, which hooks up notification lifecycle
     * events to their event handlers.
     *------------------------------------------------------------------------**/

    private async getNotificationsWatcher(basePath: string, recreate = false): Promise<FSWatcher> {
        if (NotificationsService.watcher && !recreate) {
            return NotificationsService.watcher;
        }
        await NotificationsService.watcher?.close().catch((e) => this.logger.error(e));

        const watcher = watch(basePath, {
            usePolling: CHOKIDAR_USEPOLLING,
            ignoreInitial: true,
        });
        NotificationsService.watcher = watcher;
        watcher.on('error', (error) => this.logger.error(error));
        for (const event of ['add', 'change', 'unlink'] as const) {
            watcher.on(event, (path) => {
                void this.handleNotificationEvent(path, event).catch((e) => this.logger.error(e));
            });
        }
        try {
            await new Promise<void>((resolve, reject) => {
                watcher.once('error', reject);
                watcher.once('ready', () => {
                    watcher.off('error', reject);
                    resolve();
                });
            });
        } catch (error) {
            if (NotificationsService.watcher === watcher) NotificationsService.watcher = null;
            await watcher.close().catch((closeError) => this.logger.error(closeError));
            throw error;
        }
        return watcher;
    }

    private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
        return error instanceof Error && 'code' in error && error.code === 'ENOENT';
    }

    private async handleNotificationEvent(path: string, event: NotificationFileEvent) {
        const paths = this.paths();
        const type = Object.values(NotificationType).find((type) => dirname(path) === paths[type]);
        if (!type) return;
        if (this.isHydratingOverview) {
            const pending = this.pendingNotificationEvents.get(path);
            this.pendingNotificationEvents.set(
                path,
                event === 'change' && pending === 'add' ? 'add' : event
            );
            return;
        }

        const { unread } = await this.synchronizeNotification(basename(path));
        if (type === NotificationType.UNREAD) {
            if (event === 'add' && unread) {
                await pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_ADDED, { notificationAdded: unread });
            }
            void this.publishWarningsAndAlerts();
        }
    }

    private enqueueOverviewUpdate<T>(action: () => Promise<T>): Promise<T> {
        const update = this.overviewUpdate.catch(() => undefined).then(action);
        this.overviewUpdate = update;
        return update;
    }

    private async readNotificationCopy(id: string, type: NotificationType) {
        try {
            return await this.loadNotificationFile(this.notificationPath(id, type), type);
        } catch (error) {
            if (this.isMissingFileError(error)) return null;
            throw error;
        }
    }

    private synchronizeNotification(id: string) {
        return this.enqueueOverviewUpdate(async () => {
            const [unread, archive] = await Promise.all([
                this.readNotificationCopy(id, NotificationType.UNREAD),
                this.readNotificationCopy(id, NotificationType.ARCHIVE),
            ]);
            const changed = this.updateNotificationCounts(id, {
                UNREAD: unread?.importance,
                ARCHIVE: archive?.importance,
            });
            if (changed) await this.publishOverview();
            return { unread };
        });
    }

    private updateNotificationCounts(id: string, next: NotificationFileState): boolean {
        const previous = this.notificationFiles.get(id) ?? {};
        let changed = false;
        for (const type of Object.values(NotificationType)) {
            const previousImportance = this.visibleImportance(previous, type);
            const nextImportance = this.visibleImportance(next, type);
            if (previousImportance === nextImportance) continue;
            const counts = NotificationsService.overview[type.toLowerCase()];
            if (previousImportance) {
                counts[previousImportance.toLowerCase()]--;
                counts.total--;
            }
            if (nextImportance) this.increment(nextImportance, counts);
            changed = true;
        }
        if (next.UNREAD === undefined && next.ARCHIVE === undefined) {
            this.notificationFiles.delete(id);
        } else {
            this.notificationFiles.set(id, next);
        }
        return changed;
    }

    private visibleImportance(files: NotificationFileState, type: NotificationType) {
        return type === NotificationType.UNREAD || files.UNREAD === undefined ? files[type] : undefined;
    }

    /**
     * Returns a stable snapshot of the current notification overview.
     *
     * The notification overview is a dictionary that contains the total number of notifications
     * of each importance level, as well as the total number of notifications.
     *
     * @returns A Promise that resolves to a NotificationOverview object.
     */
    public getOverview(): NotificationOverview {
        return structuredClone(NotificationsService.overview);
    }

    private publishOverview(overview = this.getOverview()) {
        return pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, {
            notificationsOverview: overview,
        });
    }

    private publishWarningsAndAlerts(): Promise<void> {
        this.warningsUpdateRequested = true;
        if (this.warningsUpdate) return this.warningsUpdate;

        this.warningsUpdate = Promise.resolve().then(async () => {
            try {
                while (this.warningsUpdateRequested) {
                    await this.overviewUpdate.catch(() => undefined);
                    this.warningsUpdateRequested = false;
                    try {
                        const warningsAndAlerts = await this.getWarningsAndAlerts();
                        await pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_WARNINGS_AND_ALERTS, {
                            notificationsWarningsAndAlerts: warningsAndAlerts,
                        });
                    } catch (error) {
                        this.logger.error(
                            '[publishWarningsAndAlerts] Failed to broadcast warnings and alerts snapshot',
                            error as Error
                        );
                    }
                }
            } finally {
                this.warningsUpdate = null;
            }
        });
        return this.warningsUpdate;
    }

    private increment(importance: NotificationImportance, collector: NotificationCounts) {
        collector[importance.toLowerCase()] += 1;
        collector['total'] += 1;
    }

    public async recalculateOverview() {
        await this.waitForInitialization();
        return this.reconcileOverview();
    }

    private reconcileOverview() {
        return this.enqueueOverviewUpdate(async () => {
            const snapshot = await this.buildOverviewSnapshot();
            if (!snapshot.errorOccurred) {
                this.notificationFiles = snapshot.files;
                NotificationsService.overview = snapshot.overview;
                await this.publishOverview();
            }
            return { error: snapshot.errorOccurred, overview: this.getOverview() };
        });
    }

    private async buildOverviewSnapshot() {
        const overview: NotificationOverview = {
            unread: {
                alert: 0,
                info: 0,
                warning: 0,
                total: 0,
            },
            archive: {
                alert: 0,
                info: 0,
                warning: 0,
                total: 0,
            },
        };
        const files = new Map<string, NotificationFileState>();
        const recalculate = async (type: NotificationType) => {
            // Keep hidden archive copies in the index so removing unread can reveal them.
            const paths = await this.listFilesInFolder(this.paths()[type]);
            const [notifications, errors] = await this.loadNotificationsFromPaths(paths, { type });
            const failure = errors.find((error) => !this.isMissingFileError(error));
            if (failure) throw failure;
            for (const notification of notifications) {
                const copies = files.get(notification.id) ?? {};
                copies[type] = notification.importance;
                files.set(notification.id, copies);
            }
        };
        const results = await batchProcess(Object.values(NotificationType), recalculate);
        if (results.errorOccurred) {
            results.errors.forEach((error) => this.logger.error('[recalculateOverview] ' + error));
        }
        for (const copies of files.values()) {
            for (const type of Object.values(NotificationType)) {
                const importance = this.visibleImportance(copies, type);
                if (importance) this.increment(importance, overview[type.toLowerCase()]);
            }
        }
        return { errorOccurred: results.errorOccurred, overview, files };
    }

    /**------------------------------------------------------------------------
     *                           CRUD: Creating Notifications
     *------------------------------------------------------------------------**/

    public async createNotification(data: NotificationData): Promise<Notification> {
        await this.waitForInitialization();
        const id: string = await this.makeNotificationId(data.title);
        const fileData = this.makeNotificationFileData(data);

        try {
            const [command, args] = this.getLegacyScriptArgs(fileData);
            await execa(command, args);
        } catch (error) {
            // manually write the file if the script fails
            this.logger.debug(`[createNotification] legacy notifier failed: ${error}`);
            this.logger.verbose(`[createNotification] Writing: ${JSON.stringify(fileData, null, 4)}`);

            const path = this.notificationPath(id, NotificationType.UNREAD);
            const ini = encodeIni(fileData);
            // this.logger.debug(`[createNotification] INI: ${ini}`);
            await writeFile(path, ini);
        }

        void this.publishWarningsAndAlerts();

        return this.notificationFileToGqlNotification({ id, type: NotificationType.UNREAD }, fileData);
    }

    /**
     * Given a NotificationIni, returns a tuple containing the command and arguments to be
     * passed to the legacy notifier script.
     *
     * The tuple represents a cli command to create an unraid notification.
     *
     * @param notification The notification to be converted to command line arguments.
     * @returns A 2-element tuple containing the legacy notifier command and arguments.
     */
    public getLegacyScriptArgs(notification: NotificationIni): [string, string[]] {
        const { event, subject, description, link, importance } = notification;
        const args = [
            ['-i', importance],
            ['-e', event],
            ['-s', subject],
            ['-d', description],
        ];
        if (link) {
            args.push(['-l', link]);
        }
        return ['/usr/local/emhttp/webGui/scripts/notify', args.flat()];
    }

    private async makeNotificationId(eventTitle: string, replacement = '_'): Promise<string> {
        const { default: filenamify } = await import('filenamify');
        const allWhitespace = /\s+/g;
        // replace symbols & whitespace with underscores
        const prefix = filenamify(eventTitle, { replacement }).replace(allWhitespace, replacement);

        /**-----------------------
         *     Why UUIDv7?
         *
         *  So we can sort notifications chronologically
         *  without having to read the contents of the files.
         *
         *  This makes it more annoying to manually distinguish id's because
         *  the start of the uuid encodes the timestamp, and the random bits
         *  are at the end, so the first few chars of each uuid might be relatively common.
         *
         *  See https://uuid7.com/ for an overview of UUIDv7
         *  See https://park.is/blog_posts/20240803_extracting_timestamp_from_uuid_v7/ for how
         *      timestamps are encoded
         *------------------------**/
        return `${prefix}_${uuidv7()}.notify`;
    }

    /** transforms gql compliant NotificationData to .notify compliant data*/
    private makeNotificationFileData(notification: NotificationData): NotificationIni {
        const { title, subject, description, link, importance } = notification;

        const data: NotificationIni = {
            timestamp: unraidTimestamp().toString(),
            event: title,
            subject,
            description,
            importance: this.gqlImportanceToFileImportance(importance),
        };

        // HACK - the ini encoder stringifies all fields defined on the object, even if they're undefined.
        // this results in a field like "link=undefined" in the resulting ini string.
        // So, we only add a link if it's defined

        if (link) {
            data.link = link;
        }
        return data;
    }

    /**------------------------------------------------------------------------
     *                           CRUD: Deleting Notifications
     *------------------------------------------------------------------------**/

    public async deleteNotification({ id, type }: Pick<Notification, 'id' | 'type'>) {
        await this.waitForInitialization();
        const path = this.notificationPath(id, type);

        // we don't want to update the overview stats if the deletion (unlink) fails
        // so we do the file system ops first

        const notification = await this.loadNotificationFile(path, type);
        await unlink(path);

        await this.synchronizeNotification(id);
        if (type === NotificationType.UNREAD) {
            void this.publishWarningsAndAlerts();
        }

        // return both the overview & the deleted notification
        // this helps us reference the deleted notification in-memory if we want
        return { notification, overview: NotificationsService.overview };
    }

    /**
     * Deletes all notifications of a specific type and resets their overview stats.
     *
     * @param type - The type of notifications to delete (UNREAD or ARCHIVE)
     * @remarks Ensures the notifications directory exists before emptying it
     */
    public async deleteNotifications(type: NotificationType) {
        await this.waitForInitialization();
        const folder = this.paths()[type];
        const ids = new Set(await readdir(folder));
        for (const [id, copies] of this.notificationFiles) {
            if (copies[type] !== undefined) ids.add(id);
        }
        await emptyDir(folder);
        await Promise.all([...ids].map((id) => this.synchronizeNotification(id)));
        if (type === NotificationType.UNREAD) {
            void this.publishWarningsAndAlerts();
        }
        return this.getOverview();
    }

    /**
     * Deletes all notifications from disk while preserving the directory structure.
     * Resets overview stats to zero.
     *
     * @returns The updated notification overview stats
     */
    public async deleteAllNotifications() {
        await this.deleteNotifications(NotificationType.ARCHIVE);
        await this.deleteNotifications(NotificationType.UNREAD);
        return this.getOverview();
    }

    /**------------------------------------------------------------------------
     *                           CRUD: Updating Notifications
     *------------------------------------------------------------------------**/

    private moveNotification(params: { from: NotificationType; to: NotificationType }) {
        const { from, to } = params;
        return async (notification: Notification) => {
            const currentPath = this.notificationPath(notification.id, from);
            const targetPath = this.notificationPath(notification.id, to);
            await rename(currentPath, targetPath);
            // A legacy archive copy may already exist, so rename need not emit an add event.
            await this.synchronizeNotification(notification.id);
        };
    }

    public async archiveNotification({ id }: Pick<Notification, 'id'>): Promise<Notification> {
        await this.waitForInitialization();
        const unreadPath = this.notificationPath(id, NotificationType.UNREAD);

        // We expect to only archive 'unread' notifications, but it's possible that the notification
        // has already been archived or deleted (e.g. retry logic, spike in network latency).
        if (!(await fileExists(unreadPath))) {
            this.logger.warn(`[archiveNotification] Could not find notification in unreads: ${id}`);
            throw new AppError(`Could not find notification in unreads: ${id}`, 404);
        }

        const notification = await this.loadNotificationFile(unreadPath, NotificationType.UNREAD);
        const moveToArchive = this.moveNotification({
            from: NotificationType.UNREAD,
            to: NotificationType.ARCHIVE,
        });
        await moveToArchive(notification);

        void this.publishWarningsAndAlerts();

        return {
            ...notification,
            type: NotificationType.ARCHIVE,
        };
    }

    public async markAsUnread({ id }: Pick<Notification, 'id'>): Promise<Notification> {
        await this.waitForInitialization();
        const archivePath = this.notificationPath(id, NotificationType.ARCHIVE);
        // the target notification might not be in the archive!
        if (!(await fileExists(archivePath))) {
            this.logger.warn(`[markAsUnread] Could not find notification in archive: ${id}`);
            throw new AppError(`Could not find notification in archive: ${id}`, 404);
        }

        const notification = await this.loadNotificationFile(archivePath, NotificationType.ARCHIVE);
        const moveToUnread = this.moveNotification({
            from: NotificationType.ARCHIVE,
            to: NotificationType.UNREAD,
        });

        await moveToUnread(notification);
        void this.publishWarningsAndAlerts();
        return {
            ...notification,
            type: NotificationType.UNREAD,
        };
    }

    public async archiveAll(importance?: NotificationImportance) {
        await this.waitForInitialization();
        const { UNREAD } = this.paths();

        if (!importance) {
            await readdir(UNREAD).then((ids) => this.archiveIds(ids));
            return { overview: NotificationsService.overview };
        }

        const unreads = await this.listFilesInFolder(UNREAD);
        const [notifications] = await this.loadNotificationsFromPaths(unreads, { importance });
        const archive = this.moveNotification({
            from: NotificationType.UNREAD,
            to: NotificationType.ARCHIVE,
        });

        const stats = await batchProcess(notifications, archive);
        void this.publishWarningsAndAlerts();
        return { ...stats, overview: this.getOverview() };
    }

    public async unarchiveAll(importance?: NotificationImportance) {
        await this.waitForInitialization();
        const { ARCHIVE } = this.paths();

        if (!importance) {
            // use arrow function to preserve `this`
            await readdir(ARCHIVE).then((ids) => this.unarchiveIds(ids));
            return { overview: NotificationsService.overview };
        }

        const archives = await this.listFilesInFolder(ARCHIVE);
        const [notifications] = await this.loadNotificationsFromPaths(archives, { importance });
        const unArchive = this.moveNotification({
            from: NotificationType.ARCHIVE,
            to: NotificationType.UNREAD,
        });

        const stats = await batchProcess(notifications, unArchive);
        void this.publishWarningsAndAlerts();
        return { ...stats, overview: this.getOverview() };
    }

    /**
     * Archives notifications with the given id's.
     *
     * A notification id looks like '{event_type}_{uuid}.notify'
     * See `makeNotificationId` for more info.
     *
     * ID's are NOT full paths in this context
     * @param ids a list of '*.notify' id's, which correspond to id files
     * @returns
     */
    public archiveIds(ids: string[]) {
        return batchProcess(ids, (id) => this.archiveNotification({ id }));
    }

    /**
     * Unarchives (marks as unread) notifications with the given id's.
     *
     * A notification id looks like '{event_type}_{uuid}.notify'
     * See `makeNotificationId` for more info.
     *
     * ID's are NOT full paths in this context
     * @param ids a list of '*.notify' id's, which correspond to id files
     * @returns
     */
    public unarchiveIds(ids: string[]) {
        return batchProcess(ids, (id) => this.markAsUnread({ id }));
    }

    /**------------------------------------------------------------------------
     *                           CRUD: Reading Notifications
     *------------------------------------------------------------------------**/

    /**
     * Retrieves all notifications from the file system.
     * @param filters Filters to apply to the notifications
     * @returns An array of all notifications in the system.
     */
    public async getNotifications(filters: NotificationFilter): Promise<Notification[]> {
        await this.waitForInitialization();
        this.logger.verbose('Getting Notifications');

        const { type = NotificationType.UNREAD } = filters;
        const files = await this.listNotificationFiles(type);

        const [notifications] = await this.loadNotificationsFromPaths(files, filters);
        return notifications;
    }

    private async listNotificationFiles(type: NotificationType): Promise<string[]> {
        const { ARCHIVE, UNREAD } = this.paths();
        if (type === NotificationType.UNREAD) {
            return this.listFilesInFolder(UNREAD);
        }

        // The legacy notifier writes each new notification to both directories.
        const unreads = new Set(await readdir(UNREAD));
        return this.listFilesInFolder(ARCHIVE, (archives) =>
            archives.filter((file) => !unreads.has(file))
        );
    }

    /**
     * Creates a notification only if an equivalent unread notification does not already exist.
     *
     * @param data The notification data to create.
     * @returns The created notification, or null if a duplicate was detected.
     */
    public async notifyIfUnique(data: NotificationData): Promise<Notification | null> {
        const fingerprint = this.getNotificationFingerprintFromData(data);
        const hasDuplicate = await this.hasUnreadNotificationWithFingerprint(fingerprint);

        if (hasDuplicate) {
            this.logger.verbose(
                `[notifyIfUnique] Skipping notification creation for duplicate fingerprint: ${fingerprint}`
            );
            return null;
        }

        return this.createNotification(data);
    }

    /**
     * Returns a deduplicated list of unread warning and alert notifications.
     *
     * Deduplication is based on the combination of importance, title, subject, description, and link.
     * This ensures repeated notifications with the same user-facing content are only shown once, while
     * still prioritizing the most recent occurrence of each unique notification.
     *
     * @param limit Maximum number of unique notifications to return. Default: 50.
     */
    public async getWarningsAndAlerts(limit = 50): Promise<Notification[]> {
        const notifications = await this.loadUnreadNotifications();
        const deduped: Notification[] = [];
        const seen = new Set<string>();

        for (const notification of notifications) {
            if (
                notification.importance !== NotificationImportance.ALERT &&
                notification.importance !== NotificationImportance.WARNING
            ) {
                continue;
            }

            const key = this.getDeduplicationKey(notification);
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            deduped.push(notification);

            if (deduped.length >= limit) {
                break;
            }
        }

        return deduped;
    }

    /**
     * Given a path to a folder, returns the full (absolute) paths of the folder's top-level contents.
     * Sorted latest-first by default.
     *
     * @param folderPath The path of the folder to read.
     * @param narrowContent Returns which files from `folderPath` to include. Defaults to all.
     * @param sortFn An optional function to sort folder contents. Defaults to descending birth time.
     * @returns A list of absolute paths of all the files and contents in the folder.
     */
    private async listFilesInFolder(
        folderPath: string,
        narrowContent: (contents: string[]) => string[] = (contents) => contents,
        sortFn: SortFn<Stats> = (fileA, fileB) => fileB.birthtimeMs - fileA.birthtimeMs // latest first
    ): Promise<string[]> {
        const contents = narrowContent(await readdir(folderPath));
        const contentStats = await this.settleInBatches(contents, async (content) => {
            const path = join(folderPath, content);
            const stats = await stat(path);
            return { path, stats };
        });
        const statFailure = contentStats
            .filter(isRejected)
            .find((result) => !this.isMissingFileError(result.reason));

        if (statFailure) {
            throw statFailure.reason;
        }

        return contentStats
            .filter((result): result is PromiseFulfilledResult<{ path: string; stats: Stats }> =>
                isFulfilled(result)
            )
            .map((result) => result.value)
            .sort((fileA, fileB) => sortFn(fileA.stats, fileB.stats))
            .map(({ path }) => path);
    }

    /**
     * Given a an array of files, reads and filters all the files in the directory,
     * and attempts to parse each file as a Notification.
     *
     * Returns an array of two elements:
     * - the first element is an array of successfully parsed and filtered Notifications,
     * - the second element is an array of errors for any files that failed parsing.
     *
     * @param files the files (absolute paths) to read
     * @param filters the filters to apply to the notifications
     * @returns an array of two elements: [successes, errors/failures]
     */
    private async loadNotificationsFromPaths(
        files: string[],
        filters: Partial<NotificationFilter>
    ): Promise<[Notification[], unknown[]]> {
        const { importance, type, offset = 0, limit = files.length } = filters;

        const results = await this.settleInBatches(files.slice(offset, limit + offset), (file) =>
            this.loadNotificationFile(file, type ?? NotificationType.UNREAD)
        );

        // if the filter is defined & truthy, tests if the actual value matches the filter
        const passesFilter = <T>(actual: T, filter?: unknown) => !filter || actual === filter;

        return [
            results
                .filter(isFulfilled)
                .map((result) => result.value)
                .filter(
                    (notification) =>
                        passesFilter(notification.importance, importance) &&
                        passesFilter(notification.type, type)
                )
                .sort(this.sortLatestFirst),
            results.filter(isRejected).map((result) => result.reason),
        ];
    }

    private async settleInBatches<Input, Output>(
        items: Input[],
        action: (item: Input) => Promise<Output>,
        batchSize = NotificationsService.FILE_IO_BATCH_SIZE
    ): Promise<PromiseSettledResult<Output>[]> {
        const results: PromiseSettledResult<Output>[] = [];

        for (let index = 0; index < items.length; index += batchSize) {
            const batch = items.slice(index, index + batchSize);
            results.push(...(await Promise.allSettled(batch.map(action))));
        }

        return results;
    }

    /**
     * Loads a notification file from disk, parses it to a Notification object, and
     * validates the object against the NotificationSchema.
     *
     * If the file contains invalid data (doesn't conform to the Notification schema),
     * instead of throwing, returns a masked warning notification with details masked,
     * and logs a warning. This allows the system to gracefully handle corrupt or malformed notifications.
     *
     * @param path The path to the notification file on disk.
     * @param type The type of the notification that is being loaded.
     * @returns A parsed Notification object, or a masked warning notification if invalid.
     * @throws File system errors (file not found, permission issues) or unexpected validation errors.
     */
    private async loadNotificationFile(path: string, type: NotificationType): Promise<Notification> {
        const rawContent = await readFile(path, 'utf-8');
        const decodedContent = decode(rawContent);

        const notificationFile = parseConfig<NotificationIni>({
            file: decodedContent,
            type: 'ini',
        });

        // this.logger.verbose(`Loaded notification ini file from ${path}}`);

        const notification: Notification = this.notificationFileToGqlNotification(
            { id: this.getIdFromPath(path), type },
            notificationFile
        );

        // The contents of the file, and therefore the notification, may not always be a valid notification.
        // so we parse it through the schema to make sure it is

        try {
            const validatedNotification = await validateObject(Notification, notification);
            return validatedNotification;
        } catch (error) {
            if (!(error instanceof ValidationError)) {
                throw error;
            }
            const errorsToLog = error.children?.length ? error.children : error;
            this.logger.warn(errorsToLog, `notification file at ${path} is invalid. Will mask.`);
            const nameMask = this.getIdFromPath(path);
            const dateMask = new Date();
            return {
                id: nameMask,
                type,
                title: nameMask,
                subject: nameMask,
                description: `This notification is invalid and cannot be displayed! For details, see the logs and the notification file at ${path}`,
                importance: NotificationImportance.WARNING,
                timestamp: dateMask.toISOString(),
                formattedTimestamp: this.formatDatetime(dateMask),
            };
        }
    }

    private getIdFromPath(path: string) {
        return basename(path);
    }

    /**
     * Takes a NotificationIni (ini file data) and a few details of a notification,
     * and combines them into a Notification object.
     *
     * Does *not* validate the returned Notification object or the input file data.
     * This simply encapsulates data transformation logic.
     *
     * @param details The 'id' and 'type' of the notification to be combined.
     * @param fileData The NotificationIni data from the notification's ini file.
     * @returns A full Notification object.
     */
    private notificationFileToGqlNotification(
        details: Pick<Notification, 'id' | 'type'>,
        fileData: NotificationIni
    ): Notification {
        const { importance, timestamp, event: title, description = '', ...passthroughData } = fileData;
        const { type, id } = details;
        return {
            ...passthroughData,
            id,
            type,
            title,
            description,
            importance: this.fileImportanceToGqlImportance(importance),
            timestamp: this.parseNotificationDateToIsoDate(timestamp)?.toISOString(),
            formattedTimestamp: this.formatTimestamp(timestamp),
        };
    }

    private fileImportanceToGqlImportance(
        importance: NotificationIni['importance']
    ): NotificationImportance {
        switch (importance) {
            case 'alert':
                return NotificationImportance.ALERT;
            case 'warning':
                return NotificationImportance.WARNING;
            default:
                return NotificationImportance.INFO;
        }
    }

    private gqlImportanceToFileImportance(
        importance: NotificationImportance
    ): NotificationIni['importance'] {
        switch (importance) {
            case NotificationImportance.ALERT:
                return 'alert';
            case NotificationImportance.WARNING:
                return 'warning';
            default:
                return 'normal';
        }
    }

    private parseNotificationDateToIsoDate(unixStringSeconds: string | undefined): Date | null {
        const timeStamp = Number(unixStringSeconds);
        if (unixStringSeconds && !Number.isNaN(timeStamp)) {
            return new Date(timeStamp * 1_000);
        }
        // i.e. if unixStringSeconds is an empty string or represents a non-numberS
        return null;
    }

    private formatTimestamp(timestamp: string) {
        const date = this.parseNotificationDateToIsoDate(timestamp);
        if (!date) {
            this.logger.warn(`[formatTimestamp] Could not parse date from timestamp: ${date}`);
            return timestamp;
        }
        return this.formatDatetime(date);
    }

    private formatDatetime(date: Date) {
        const { display: settings } = getters.dynamix();
        if (!settings) {
            this.logger.warn(
                '[formatTimestamp] Dynamix display settings not found. Cannot apply user settings.'
            );
            return date.toISOString();
        }
        return formatDatetime(date, {
            dateFormat: settings.date,
            timeFormat: settings.time,
            omitTimezone: true,
        });
    }

    /**------------------------------------------------------------------------
     *                           Helpers
     *------------------------------------------------------------------------**/

    private async loadUnreadNotifications(): Promise<Notification[]> {
        await this.waitForInitialization();
        const { UNREAD } = this.paths();
        const files = await this.listFilesInFolder(UNREAD);
        const [notifications] = await this.loadNotificationsFromPaths(files, {
            type: NotificationType.UNREAD,
        });
        return notifications;
    }

    private async hasUnreadNotificationWithFingerprint(fingerprint: string): Promise<boolean> {
        const notifications = await this.loadUnreadNotifications();
        return notifications.some(
            (notification) => this.getDeduplicationKey(notification) === fingerprint
        );
    }

    private sortLatestFirst(a: Notification, b: Notification) {
        const defaultTimestamp = 0;
        return Number(b.timestamp ?? defaultTimestamp) - Number(a.timestamp ?? defaultTimestamp);
    }

    private getDeduplicationKey(notification: Notification): string {
        return this.getNotificationFingerprint(notification);
    }

    private getNotificationFingerprintFromData(data: NotificationData): string {
        return this.getNotificationFingerprint({
            importance: data.importance,
            title: data.title,
            subject: data.subject,
            description: data.description,
            link: data.link,
        });
    }

    private getNotificationFingerprint({
        importance,
        title,
        subject,
        description,
        link,
    }: Pick<Notification, 'importance' | 'title' | 'subject' | 'description'> & {
        link?: string | null;
    }): string {
        const makePart = (value?: string | null) => (value ?? '').trim();
        return [
            importance,
            makePart(title),
            makePart(subject),
            makePart(description),
            makePart(link),
        ].join('|');
    }
}
