import { NotificationIni } from '@app/core/types/states/notification';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { NotificationSchema } from '@app/graphql/generated/api/operations';
import {
    Importance,
    NotificationType,
    type Notification,
    NotificationFilter,
    NotificationOverview,
    NotificationData,
} from '@app/graphql/generated/api/types';
import { getters } from '@app/store';
import { Injectable } from '@nestjs/common';
import { readdir, rename, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { isFulfilled, isRejected } from '@app/utils';
import { FSWatcher, watch } from 'chokidar';
import { FileLoadStatus } from '@app/store/types';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub';
import { fileExists } from '@app/core/utils/files/file-exists';
import { encode as encodeIni } from 'ini';

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

        NotificationsService.overview[type.toLowerCase()][notification.importance.toLowerCase()] += 1;
        NotificationsService.overview[type.toLowerCase()]['total'] += 1;

        pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_ADDED, {
            notificationAdded: notification,
        });

        pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, {
            notificationsOverview: NotificationsService.overview,
        });
    }

    private async addToOverview(notification: Notification) {
        const { type, importance } = notification;

        NotificationsService.overview[type.toLowerCase()][importance.toLowerCase()] += 1;
        NotificationsService.overview[type.toLowerCase()]['total'] += 1;

        pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_ADDED, {
            notificationAdded: notification,
        });

        pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, {
            notificationsOverview: NotificationsService.overview,
        });
    }

    private async removeFromOverview(notification: Notification) {
        const { type, id, importance } = notification;
        this.logger.debug(`Removing ${type} Notification: ${id}`);

        NotificationsService.overview[type.toLowerCase()][importance.toLowerCase()] -= 1;
        NotificationsService.overview[type.toLowerCase()]['total'] -= 1;

        return pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, {
            notificationsOverview: NotificationsService.overview,
        });
    }

    public async getOverview(): Promise<NotificationOverview> {
        return NotificationsService.overview;
    }

    /**------------------------------------------------------------------------
     *                           CRUD: Creating Notifications
     *------------------------------------------------------------------------**/

    public async createNotification(data: NotificationData): Promise<Notification> {
        // const id: string = this.makeNotificationId();
        const id: string = '_DEV_CUSTOM_NOTIFICATION_1234.notify'; // placeholder
        const path = join(this.paths().UNREAD, id);

        const fileData = this.makeNotificationFileData(data);
        const ini = encodeIni(fileData);

        await writeFile(path, ini);
        // await this.addToOverview(notification);
        // make sure both NOTIFICATION_ADDED and NOTIFICATION_OVERVIEW are fired
        return { ...data, id, type: NotificationType.UNREAD, timestamp: fileData.timestamp };
    }

    private makeNotificationFileData(notification: NotificationData): NotificationIni {
        const { title, subject, description, link, importance } = notification;
        const secondsSinceUnixEpoch = Math.floor(Date.now() / 1_000);

        const data: NotificationIni = {
            timestamp: secondsSinceUnixEpoch.toString(),
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

    /**------------------------------------------------------------------------
     *                           CRUD: Updating Notifications
     *------------------------------------------------------------------------**/

    public async archiveNotification({ id }: Pick<Notification, 'id'>): Promise<NotificationOverview> {
        const { UNREAD, ARCHIVE } = this.paths();
        const unreadPath = join(UNREAD, id);
        const archivePath = join(ARCHIVE, id);

        if (!(await fileExists(unreadPath))) {
            this.logger.warn(`[archiveNotification] Could not find notification in unreads: ${id}`);
            return NotificationsService.overview;
        }

        const notification = await this.loadNotificationFile(unreadPath, NotificationType.UNREAD);
        await rename(unreadPath, archivePath);
        await this.removeFromOverview(notification);

        /**-----------------------
         *     Event & PubSub logic
         *
         * We assume `rename` kicks off 'unlink' and 'add' events
         * in the chokidar file watcher.
         *
         * We assume the 'add' handler publishes to
         * NOTIFICATION_ADDED & NOTIFICATION_OVERVIEW,
         * and that no pubsub or overview updates occur upon 'unlink'.
         *
         * Thus, we explicitly update our state & pubsub via `removeFromOverview`
         * and implicitly expect it to be updated via our filesystem changes.
         *
         * The reasons for this discrepancy are:
         *  - Backwards compatibility: not every notification will be created through this API,
         *    so we track state by watching the store (i.e. the file system).
         *
         *  - Technical Limitations: By the time the unlink event fires, the notification file
         *    can no longer be read. This means we can only track overview totals accurately;
         *    to track other stats, we have to update them manually, prior to file deletion.
         *------------------------**/

        return NotificationsService.overview;
    }

    public async markAsUnread({ id }: Pick<Notification, 'id'>) {
        const { UNREAD, ARCHIVE } = this.paths();
        const unreadPath = join(UNREAD, id);
        const archivePath = join(ARCHIVE, id);

        if (!(await fileExists(archivePath))) {
            this.logger.warn(`[markAsUnread] Could not find notification in archive: ${id}`);
            return NotificationsService.overview;
        }

        const notification = await this.loadNotificationFile(archivePath, NotificationType.ARCHIVE);
        await rename(archivePath, unreadPath);

        await this.removeFromOverview(notification);

        // @see `archiveNotification` for why this is commented out, and why there are 2
        //   different ways of updating the overview & pubsub
        //
        // await this.addToOverview({ ...notification, type: NotificationType.UNREAD });

        return NotificationsService.overview;
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

        const unreadFiles = await this.getFilesInFolder(directoryPath);
        const [notifications] = await this.getNotificationsFromPaths(unreadFiles, filters);

        return notifications;
    }

    /**
     * Given a path to a folder, returns the full (absolute) paths of the folder's top-level contents.
     * @param folderPath The path of the folder to read.
     * @returns A list of absolute paths of all the files and contents in the folder.
     */
    private async getFilesInFolder(folderPath: string): Promise<string[]> {
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
    private async getNotificationsFromPaths(
        files: string[],
        filters: NotificationFilter
    ): Promise<[Notification[], unknown[]]> {
        const { limit, importance, type, offset } = filters;

        const fileReads = files
            .slice(offset, limit + offset)
            .map((file) => this.loadNotificationFile(file, type ?? NotificationType.UNREAD));
        const results = await Promise.allSettled(fileReads);

        return [
            results
                .filter(isFulfilled)
                .map((result) => result.value)
                .filter((notification) => {
                    if (importance && importance !== notification.importance) {
                        return false;
                    }

                    if (type && type !== notification.type) {
                        return false;
                    }

                    return true;
                })
                .sort(
                    (a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
                ),
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

        this.logger.debug(
            `Loaded notification ini file from ${path}: ${JSON.stringify(notificationFile, null, 4)}`
        );

        const notification: Notification = {
            id: path,
            title: notificationFile.event,
            subject: notificationFile.subject,
            description: notificationFile.description ?? '',
            importance: this.fileImportanceToGqlImportance(notificationFile.importance),
            link: notificationFile.link,
            timestamp: this.parseNotificationDateToIsoDate(notificationFile.timestamp),
            type,
        };

        // The contents of the file, and therefore the notification, may not always be a valid notification.
        // so we parse it through the schema to make sure it is

        return NotificationSchema().parse(notification);
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

    /**
     * Returns the paths to the notification directories.
     *
     * @returns an object with the:
     *          - base path,
     *          - path to the unread notifications,
     *          - path to the archived notifications
     */
    private paths(): Record<'basePath' | NotificationType, string> {
        const basePath = getters.dynamix().notify!.path;
        const makePath = (type: NotificationType) => join(basePath, type.toLowerCase());
        return {
            basePath,
            [NotificationType.UNREAD]: makePath(NotificationType.UNREAD),
            [NotificationType.ARCHIVE]: makePath(NotificationType.ARCHIVE),
        };
    }
}
