import { NotificationIni } from '@app/core/types/states/notification';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { NotificationSchema } from '@app/graphql/generated/api/operations';
import {
    Importance,
    NotificationType,
    type Notification,
    type NotificationFilter,
    type NotificationOverview,
    type NotificationData,
    type NotificationCounts,
} from '@app/graphql/generated/api/types';
import { getters } from '@app/store';
import { Injectable } from '@nestjs/common';
import { mkdir, readdir, rename, rm, unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import { Logger } from '@nestjs/common';
import { isFulfilled, isRejected, unraidTimestamp } from '@app/utils';
import { FSWatcher, watch } from 'chokidar';
import { FileLoadStatus } from '@app/store/types';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub';
import { fileExists } from '@app/core/utils/files/file-exists';
import { encode as encodeIni } from 'ini';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class NotificationsService {
    private logger = new Logger(NotificationsService.name);
    private static watcher: FSWatcher | null = null;

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
        NotificationsService.watcher = this.getNotificationsWatcher();
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

    private getNotificationsWatcher() {
        const { notify, status } = getters.dynamix();
        if (status === FileLoadStatus.LOADED && notify?.path) {
            if (NotificationsService.watcher) {
                return NotificationsService.watcher;
            }

            NotificationsService.watcher = watch(notify.path, {}).on('add', (path) => {
                void this.handleNotificationAdd(path).catch((e) => this.logger.error(e));
            });
            // Do we even want to listen to removals?
            // .on('unlink', (path) => {
            //     void this.handleNotificationRemoval(path).catch((e) =>
            //         this.logger.error(e)
            //     );
            // });

            return NotificationsService.watcher;
        }
        return null;
    }

    private async handleNotificationAdd(path: string) {
        // The path looks like /{notification base path}/{type}/{notification id}
        const type = path.includes('/unread/') ? NotificationType.UNREAD : NotificationType.ARCHIVE;
        this.logger.debug(`Adding ${type} Notification: ${path}`);

        const notification = await this.loadNotificationFile(path, NotificationType[type]);
        this.increment(notification.importance, NotificationsService.overview[type.toLowerCase()]);

        this.publishOverview();
        pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_ADDED, {
            notificationAdded: notification,
        });
    }

    private async removeFromOverview(notification: Notification) {
        const { type, id, importance } = notification;
        this.logger.debug(`Removing ${type} Notification: ${id}`);

        this.decrement(importance, NotificationsService.overview[type.toLowerCase()]);
        return this.publishOverview();
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

    private increment(importance: Importance, collector: NotificationCounts) {
        collector[importance.toLowerCase()] += 1;
        collector['total'] += 1;
    }

    private decrement(importance: Importance, collector: NotificationCounts) {
        collector[importance.toLowerCase()] -= 1;
        collector['total'] -= 1;
    }

    /**------------------------------------------------------------------------
     *                           CRUD: Creating Notifications
     *------------------------------------------------------------------------**/

    public async createNotification(data: NotificationData): Promise<Notification> {
        const id: string = await this.makeNotificationId(data.title);
        const path = join(this.paths().UNREAD, id);

        const fileData = this.makeNotificationFileData(data);
        this.logger.debug(`[createNotification] FileData: ${JSON.stringify(fileData, null, 4)}`);
        const ini = encodeIni(fileData);
        // this.logger.debug(`[createNotification] INI: ${ini}`);

        await writeFile(path, ini);
        // await this.addToOverview(notification);
        // make sure both NOTIFICATION_ADDED and NOTIFICATION_OVERVIEW are fired
        return this.notificationFileToGqlNotification({ id, type: NotificationType.UNREAD }, fileData);
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
        await this.removeFromOverview(notification);

        // return both the overview & the deleted notification
        // this helps us reference the deleted notification in-memory if we want
        return { notification, overview: NotificationsService.overview };
    }

    /**
     * Deletes all notifications from disk, but preserves
     * notification directories.
     *
     * Resets the notification overview to all zeroes.
     */
    public async deleteAllNotifications() {
        const { basePath, UNREAD, ARCHIVE } = this.paths();
        // ensure the directory exists before deleting
        await mkdir(basePath, { recursive: true });
        await rm(basePath, { force: true, recursive: true });
        // recreate each notification directory
        await mkdir(UNREAD, { recursive: true });
        await mkdir(ARCHIVE, { recursive: true });
        NotificationsService.overview = {
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
             *
             * Note: this introduces a pubsub race condition between this `decrement` and the `rename`.
             * To ensure correctness, re-publish the overview stats after running this function.
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

    public async archiveNotification({ id }: Pick<Notification, 'id'>): Promise<NotificationOverview> {
        const unreadPath = join(this.paths().UNREAD, id);

        // We expect to only archive 'unread' notifications, but it's possible that the notification
        // has already been archived or deleted (e.g. retry logic, spike in network latency).
        if (!(await fileExists(unreadPath))) {
            this.logger.warn(`[archiveNotification] Could not find notification in unreads: ${id}`);
            return NotificationsService.overview;
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
            ...NotificationsService.overview,
            archive: snapshot.archive,
        };
    }

    public async markAsUnread({ id }: Pick<Notification, 'id'>): Promise<NotificationOverview> {
        const archivePath = join(this.paths().ARCHIVE, id);
        // the target notification might not be in the archive!
        if (!(await fileExists(archivePath))) {
            this.logger.warn(`[markAsUnread] Could not find notification in archive: ${id}`);
            return NotificationsService.overview;
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
            ...NotificationsService.overview,
            unread: snapshot.unread,
        };
    }

    public async archiveAll(importance?: Importance) {
        const { UNREAD } = this.paths();

        if (!importance) {
            // use arrow function to preserve `this`
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

        const stats = await this.updateMany(notifications, archive);
        return { ...stats, overview: overviewSnapshot };
    }

    public async unarchiveAll(importance?: Importance) {
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

        const stats = await this.updateMany(notifications, unArchive);
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
        return this.updateMany(ids, (id) => this.archiveNotification({ id }));
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
        return this.updateMany(ids, (id) => this.markAsUnread({ id }));
    }

    /**
     * Wrapper for Promise-handling of batch operations based on
     * notification ids.
     *
     * @param notificationIds
     * @param action
     * @returns
     */
    private async updateMany<Input, T>(notificationIds: Input[], action: (id: Input) => Promise<T>) {
        const processes = notificationIds.map(action);

        const results = await Promise.allSettled(processes);
        const successes = results.filter(isFulfilled);
        const errors = results.filter(isRejected).map((result) => result.reason);

        return {
            data: successes,
            successes: successes.length,
            errors: errors,
            errorOccured: errors.length > 0,
        };
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
        this.logger.debug('Getting Notifications');

        const { ARCHIVE, UNREAD } = this.paths();
        const directoryPath = filters.type === NotificationType.ARCHIVE ? ARCHIVE : UNREAD;

        const unreadFiles = await this.listFilesInFolder(directoryPath);
        const [notifications] = await this.loadNotificationsFromPaths(unreadFiles, filters);

        return notifications;
    }

    /**
     * Given a path to a folder, returns the full (absolute) paths of the folder's top-level contents.
     * @param folderPath The path of the folder to read.
     * @returns A list of absolute paths of all the files and contents in the folder.
     */
    private async listFilesInFolder(folderPath: string): Promise<string[]> {
        const contents = await readdir(folderPath);

        return contents.map((content) => join(folderPath, content));
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

        this.logger.debug(`Loaded notification ini file from ${path}}`);

        const notification: Notification = this.notificationFileToGqlNotification(
            { id: this.getIdFromPath(path), type },
            notificationFile
        );

        // The contents of the file, and therefore the notification, may not always be a valid notification.
        // so we parse it through the schema to make sure it is

        return NotificationSchema().parse(notification);
    }

    private getIdFromPath(path: string) {
        return basename(path);
    }

    /**
     * Takes a NotificationIni (ini file data) and a few details of a notification,
     * and combines them into a Notification object.
     *
     * Does not validate the returned Notification object or the input file data.
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
        return {
            ...details,
            ...passthroughData,
            title,
            description,
            importance: this.fileImportanceToGqlImportance(importance),
            timestamp: this.parseNotificationDateToIsoDate(timestamp),
        };
    }

    private fileImportanceToGqlImportance(importance: NotificationIni['importance']): Importance {
        switch (importance) {
            case 'alert':
                return Importance.ALERT;
            case 'warning':
                return Importance.WARNING;
            default:
                return Importance.INFO;
        }
    }

    private gqlImportanceToFileImportance(importance: Importance): NotificationIni['importance'] {
        switch (importance) {
            case Importance.ALERT:
                return 'alert';
            case Importance.WARNING:
                return 'warning';
            default:
                return 'normal';
        }
    }

    private parseNotificationDateToIsoDate(unixStringSeconds: string | undefined): string | null {
        if (unixStringSeconds && !isNaN(Number(unixStringSeconds))) {
            return new Date(Number(unixStringSeconds) * 1_000).toISOString();
        }
        return null;
    }

    /**------------------------------------------------------------------------
     *                           Helpers
     *------------------------------------------------------------------------**/

    private sortLatestFirst(a: Notification, b: Notification) {
        const defaultTimestamp = 0;
        return Number(b.timestamp ?? defaultTimestamp) - Number(a.timestamp ?? defaultTimestamp);
    }
}
