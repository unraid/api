import { Injectable, Logger } from '@nestjs/common';
import { readdir, rename, stat, unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';

import type { Stats } from 'fs';
import { FSWatcher, watch } from 'chokidar';
import { execa } from 'execa';
import { emptyDir } from 'fs-extra';
import { encode as encodeIni } from 'ini';
import { v7 as uuidv7 } from 'uuid';

import { AppError } from '@app/core/errors/app-error.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { NotificationIni } from '@app/core/types/states/notification.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
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

@Injectable()
export class NotificationsService {
    private logger = new Logger(NotificationsService.name);
    private static watcher: FSWatcher | null = null;
    /**
     * The path to the notification directory - will be updated if the user changes the notifier path
     */
    private path: string | null = null;

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

    constructor() {
        this.path = getters.dynamix().notify!.path;
        void this.getNotificationsWatcher(this.path);
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
        const basePath = getters.dynamix().notify!.path;

        if (this.path !== basePath) {
            // Recreate the watcher with force = true
            void this.getNotificationsWatcher(basePath, true);
            this.path = basePath;
        }

        const makePath = (type: NotificationType) => join(basePath, type.toLowerCase());
        return {
            basePath,
            [NotificationType.UNREAD]: makePath(NotificationType.UNREAD),
            [NotificationType.ARCHIVE]: makePath(NotificationType.ARCHIVE),
        };
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

        NotificationsService.watcher = watch(basePath, { usePolling: CHOKIDAR_USEPOLLING }).on(
            'add',
            (path) => {
                void this.handleNotificationAdd(path).catch((e) => this.logger.error(e));
            }
        );

        return NotificationsService.watcher;
    }

    private async handleNotificationAdd(path: string) {
        // The path looks like /{notification base path}/{type}/{notification id}
        const type = path.includes('/unread/') ? NotificationType.UNREAD : NotificationType.ARCHIVE;
        // this.logger.debug(`Adding ${type} Notification: ${path}`);

        const notification = await this.loadNotificationFile(path, NotificationType[type]);
        this.increment(notification.importance, NotificationsService.overview[type.toLowerCase()]);

        if (type === NotificationType.UNREAD) {
            this.publishOverview();
            pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_ADDED, {
                notificationAdded: notification,
            });
        }
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

    private publishOverview(overview = NotificationsService.overview) {
        return pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, {
            notificationsOverview: overview,
        });
    }

    private increment(importance: NotificationImportance, collector: NotificationCounts) {
        collector[importance.toLowerCase()] += 1;
        collector['total'] += 1;
    }

    private decrement(importance: NotificationImportance, collector: NotificationCounts) {
        collector[importance.toLowerCase()] -= 1;
        collector['total'] -= 1;
    }

    public async recalculateOverview() {
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

        // todo - refactor this to be more memory efficient
        // i.e. by using a lazy generator vs the current eager implementation
        //
        // recalculates stats for a particular notification type
        const recalculate = async (type: NotificationType) => {
            const ids = await this.listFilesInFolder(this.paths()[type]);
            const [notifications] = await this.loadNotificationsFromPaths(ids, {});
            notifications.forEach((n) => this.increment(n.importance, overview[type.toLowerCase()]));
        };

        const results = await batchProcess(
            [NotificationType.ARCHIVE, NotificationType.UNREAD],
            recalculate
        );

        if (results.errorOccured) {
            results.errors.forEach((e) => this.logger.error('[recalculateOverview] ' + e));
        }

        NotificationsService.overview = overview;
        void this.publishOverview();
        return { error: results.errorOccured, overview: this.getOverview() };
    }

    /**------------------------------------------------------------------------
     *                           CRUD: Creating Notifications
     *------------------------------------------------------------------------**/

    public async createNotification(data: NotificationData): Promise<Notification> {
        const id: string = await this.makeNotificationId(data.title);
        const fileData = this.makeNotificationFileData(data);

        try {
            const [command, args] = this.getLegacyScriptArgs(fileData);
            await execa(command, args);
        } catch (error) {
            // manually write the file if the script fails
            this.logger.debug(`[createNotification] legacy notifier failed: ${error}`);
            this.logger.verbose(`[createNotification] Writing: ${JSON.stringify(fileData, null, 4)}`);

            const path = join(this.paths().UNREAD, id);
            const ini = encodeIni(fileData);
            // this.logger.debug(`[createNotification] INI: ${ini}`);
            await writeFile(path, ini);
        }

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
        const path = join(this.paths()[type], id);

        // we don't want to update the overview stats if the deletion (unlink) fails
        // so we do the file system ops first

        const notification = await this.loadNotificationFile(path, type);
        await unlink(path);

        this.decrement(notification.importance, NotificationsService.overview[type.toLowerCase()]);
        await this.publishOverview();

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
        await emptyDir(this.paths()[type]);
        NotificationsService.overview[type.toLowerCase()] = {
            alert: 0,
            info: 0,
            warning: 0,
            total: 0,
        };
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

    /**
     * Returns a function that:
     * 1. moves a notification from one category to another.
     * 2. updates stats overview
     * 3. updates the stats snapshot if provided
     *
     * Note: the returned function implicitly triggers a pubsub event via `fs.rename`,
     * which is expected to trigger `NOTIFICATION_ADDED` & `NOTIFICATION_OVERVIEW`.
     *
     * The published overview will include the update from this operation.
     *
     * @param params
     * @returns lambda function
     */
    private moveNotification(params: {
        from: NotificationType;
        to: NotificationType;
        snapshot?: NotificationOverview;
    }) {
        const { from, to, snapshot } = params;
        const paths = this.paths();
        const fromStatKey = from.toLowerCase();
        const toStatKey = to.toLowerCase();
        return async (notification: Notification) => {
            const currentPath = join(paths[from], notification.id);
            const targetPath = join(paths[to], notification.id);

            /**-----------------------
             *     Event, PubSub, & Overview Update logic
             *
             * We assume `rename` kicks off 'unlink' and 'add' events
             * in the chokidar file watcher (see `getNotificationsWatcher`).
             *
             * We assume the 'add' handler publishes to
             * NOTIFICATION_ADDED & NOTIFICATION_OVERVIEW,
             * and that no pubsub or overview updates occur upon 'unlink'.
             *
             * Thus, we explicitly update our state here via `decrement` and implicitly expect
             * it to be updated (i.e. incremented & pubsub'd) via our filesystem changes.
             *
             * The reasons for this discrepancy are:
             *  - Backwards compatibility: not every notification will be created through this API,
             *    so we track state by watching the store (i.e. the file system).
             *
             *  - Technical Limitations: By the time the unlink event fires, the notification file
             *    can no longer be read. This means we can only track overview totals accurately;
             *    to track other stats, we have to update them manually, prior to file deletion.
             *------------------------**/
            this.decrement(notification.importance, NotificationsService.overview[fromStatKey]);
            try {
                await rename(currentPath, targetPath);
            } catch (err) {
                // revert our earlier decrement
                // we do it this way (decrement -> try rename -> revert if error) to avoid
                // a race condition between `rename` and `decrement`
                this.increment(notification.importance, NotificationsService.overview[fromStatKey]);
                throw err;
            }

            if (snapshot) {
                this.decrement(notification.importance, snapshot[fromStatKey]);
                this.increment(notification.importance, snapshot[toStatKey]);
            }
        };
    }

    public async archiveNotification({ id }: Pick<Notification, 'id'>): Promise<Notification> {
        const unreadPath = join(this.paths().UNREAD, id);

        // We expect to only archive 'unread' notifications, but it's possible that the notification
        // has already been archived or deleted (e.g. retry logic, spike in network latency).
        if (!(await fileExists(unreadPath))) {
            this.logger.warn(`[archiveNotification] Could not find notification in unreads: ${id}`);
            throw new AppError(`Could not find notification in unreads: ${id}`, 404);
        }

        /**-----------------------
         *     Why we use a snapshot
         *
         * An implicit update to `overview` creates a race condition:
         * it might be missing changes from the 'add' event (i.e. incrementing the notification's new category).
         *
         * So, we use & modify a snapshot of the overview to make sure we're returning accurate
         * data to the client.
         *------------------------**/
        const snapshot = this.getOverview();
        const notification = await this.loadNotificationFile(unreadPath, NotificationType.UNREAD);
        const moveToArchive = this.moveNotification({
            from: NotificationType.UNREAD,
            to: NotificationType.ARCHIVE,
            snapshot,
        });
        await moveToArchive(notification);

        return {
            ...notification,
            type: NotificationType.ARCHIVE,
        };
    }

    public async markAsUnread({ id }: Pick<Notification, 'id'>): Promise<Notification> {
        const archivePath = join(this.paths().ARCHIVE, id);
        // the target notification might not be in the archive!
        if (!(await fileExists(archivePath))) {
            this.logger.warn(`[markAsUnread] Could not find notification in archive: ${id}`);
            throw new AppError(`Could not find notification in archive: ${id}`, 404);
        }

        // we use a snapshot to provide an accurate overview update
        // otherwise, we'd enter a race condition with the 'add' file watcher event handler
        const snapshot = this.getOverview();
        const notification = await this.loadNotificationFile(archivePath, NotificationType.ARCHIVE);
        const moveToUnread = this.moveNotification({
            from: NotificationType.ARCHIVE,
            to: NotificationType.UNREAD,
            snapshot,
        });

        await moveToUnread(notification);
        return {
            ...notification,
            type: NotificationType.UNREAD,
        };
    }

    public async archiveAll(importance?: NotificationImportance) {
        const { UNREAD } = this.paths();

        if (!importance) {
            await readdir(UNREAD).then((ids) => this.archiveIds(ids));
            return { overview: NotificationsService.overview };
        }

        const overviewSnapshot = this.getOverview();
        const unreads = await this.listFilesInFolder(UNREAD);
        const [notifications] = await this.loadNotificationsFromPaths(unreads, { importance });
        const archive = this.moveNotification({
            from: NotificationType.UNREAD,
            to: NotificationType.ARCHIVE,
            snapshot: overviewSnapshot,
        });

        const stats = await batchProcess(notifications, archive);
        return { ...stats, overview: overviewSnapshot };
    }

    public async unarchiveAll(importance?: NotificationImportance) {
        const { ARCHIVE } = this.paths();

        if (!importance) {
            // use arrow function to preserve `this`
            await readdir(ARCHIVE).then((ids) => this.unarchiveIds(ids));
            return { overview: NotificationsService.overview };
        }

        const overviewSnapshot = this.getOverview();
        const archives = await this.listFilesInFolder(ARCHIVE);
        const [notifications] = await this.loadNotificationsFromPaths(archives, { importance });
        const unArchive = this.moveNotification({
            from: NotificationType.ARCHIVE,
            to: NotificationType.UNREAD,
            snapshot: overviewSnapshot,
        });

        const stats = await batchProcess(notifications, unArchive);
        return { ...stats, overview: overviewSnapshot };
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
        this.logger.verbose('Getting Notifications');

        const { type = NotificationType.UNREAD } = filters;
        const { ARCHIVE, UNREAD } = this.paths();
        let files: string[];

        if (type === NotificationType.UNREAD) {
            files = await this.listFilesInFolder(UNREAD);
        } else {
            // Exclude notifications present in both unread & archive from archive.
            //* this is necessary because the legacy script writes new notifications to both places.
            //* this should be a temporary measure.
            const unreads = new Set(await readdir(UNREAD));
            files = await this.listFilesInFolder(ARCHIVE, (archives) => {
                return archives.filter((file) => !unreads.has(file));
            });
        }

        const [notifications] = await this.loadNotificationsFromPaths(files, filters);
        return notifications;
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
        const contentStats = await Promise.all(
            contents.map(async (content) => {
                // pre-map each file's stats to avoid excess calls during sorting
                const path = join(folderPath, content);
                const stats = await stat(path);
                return { path, stats };
            })
        );
        return contentStats
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

        const fileReads = files
            .slice(offset, limit + offset)
            .map((file) => this.loadNotificationFile(file, type ?? NotificationType.UNREAD));
        const results = await Promise.allSettled(fileReads);

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

    /**
     * Loads a notification file from disk, parses it to a Notification object, and
     * validates the object against the NotificationSchema.
     *
     * @param path The path to the notification file on disk.
     * @param type The type of the notification that is being loaded.
     * @returns A parsed Notification object, or throws an error if the object is invalid.
     * @throws An error if the object is invalid (doesn't conform to the graphql NotificationSchema).
     */
    private async loadNotificationFile(path: string, type: NotificationType): Promise<Notification> {
        const notificationFile = parseConfig<NotificationIni>({
            filePath: path,
            type: 'ini',
        });

        // this.logger.verbose(`Loaded notification ini file from ${path}}`);

        const notification: Notification = this.notificationFileToGqlNotification(
            { id: this.getIdFromPath(path), type },
            notificationFile
        );

        // The contents of the file, and therefore the notification, may not always be a valid notification.
        // so we parse it through the schema to make sure it is

        const validatedNotification = await validateObject(Notification, notification);
        return validatedNotification;
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
        const { display: settings } = getters.dynamix();
        const date = this.parseNotificationDateToIsoDate(timestamp);

        if (!settings) {
            this.logger.warn(
                '[formatTimestamp] Dynamix display settings not found. Cannot apply user settings.'
            );
            return timestamp;
        } else if (!date) {
            this.logger.warn(`[formatTimestamp] Could not parse date from timestamp: ${date}`);
            return timestamp;
        }
        // this.logger.debug(`[formatTimestamp] ${settings.date} :: ${settings.time} :: ${date}`);
        return formatDatetime(date, {
            dateFormat: settings.date,
            timeFormat: settings.time,
            omitTimezone: true,
        });
    }

    /**------------------------------------------------------------------------
     *                           Helpers
     *------------------------------------------------------------------------**/

    private sortLatestFirst(a: Notification, b: Notification) {
        const defaultTimestamp = 0;
        return Number(b.timestamp ?? defaultTimestamp) - Number(a.timestamp ?? defaultTimestamp);
    }
}
