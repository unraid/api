import { NotificationIni } from '@app/core/types/states/notification';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { NotificationSchema } from '@app/graphql/generated/api/operations';
import { Importance, NotificationType, type Notification, NotificationFilter, NotificationOverview, } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';
import { Injectable } from '@nestjs/common';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { isFulfilled, isRejected } from '@app/utils';
import { FSWatcher, watch } from 'chokidar';
import { FileLoadStatus } from '@app/store/types';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub';

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

  private getNotificationsWatcher() {
    const { notify, status } = getters.dynamix();
    if (status === FileLoadStatus.LOADED && notify?.path) {
      if (NotificationsService.watcher) {
        return NotificationsService.watcher;
      }

      NotificationsService.watcher = watch(notify.path, {})
        .on('add', (path) => {
          void this.handleNotificationAdd(path).catch((e) => this.logger.error(e));
        })
        // Do we even want to listen to removals?
        .on('unlink', (path) => {
          void this.handleNotificationRemoval(path).catch((e) => this.logger.error(e));
        });

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
      notificationAdded: notification
    });

    pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, {
      notificationsOverview: NotificationsService.overview
    });
  }

  private async handleNotificationRemoval(path: string) {
    pubsub.publish(PUBSUB_CHANNEL.NOTIFICATION_OVERVIEW, {
      notificationsOverview: NotificationsService.overview
    });
  }

  public async getOverview(): Promise<NotificationOverview> {
    return NotificationsService.overview;
  }

  /**
   * Retrieves all notifications from the file system.
   * @param filters Filters to apply to the notifications
   * @returns An array of all notifications in the system.
   */
  public async getNotifications(filters: NotificationFilter): Promise<Notification[]> {
    this.logger.debug('Getting Notifications');

    const notificationBasePath = getters.dynamix().notify!.path;
    const unreadDirectoryPath = join(notificationBasePath, NotificationType.UNREAD.toLowerCase());
    const archivedDirectoryPath = join(notificationBasePath, NotificationType.ARCHIVE.toLowerCase());
    const directoryPath = filters.type === NotificationType.ARCHIVE ? archivedDirectoryPath : unreadDirectoryPath;
    const unreadFiles = await this.getFilesInFolder(directoryPath);
    const [notifications] = await this.getNotificationsFromPaths(unreadFiles, filters);

    return notifications;
  }

  private async getFilesInFolder(folderPath: string): Promise<string[]> {
    const contents = await readdir(folderPath);

    return contents.map((content) => join(folderPath, content));
  }

  /**
   * Given a an array of files, reads and filters all the files in the directory,
   * and attempts to parse each file as a Notification.
   * Returns an array of two elements:
   * - the first element is an array of successfully parsed and filtered Notifications,
   * - the second element is an array of errors for any files that failed parsing.
   * @param files the files to read
   * @param filters the filters to apply to the notifications
   * @returns an array of two elements: [successes, errors/failures]
   */
  private async getNotificationsFromPaths(files: string[], filters: NotificationFilter): Promise<[Notification[], unknown[]]> {
    const { limit, importance, type, offset } = filters;

    const fileReads = files.slice(offset, limit + offset).map((file) => this.loadNotificationFile(file, type ?? NotificationType.UNREAD));
    const results = await Promise.allSettled(fileReads);

    return [
      results.filter(isFulfilled).map(result => result.value).filter((notification) => {
        if (importance && importance !== notification.importance) {
          return false;
        }

        if (type && type !== notification.type) {
          return false;
        }

        return true;
      })
        .sort(
          (a, b) =>
            new Date(b.timestamp ?? 0).getTime() -
            new Date(a.timestamp ?? 0).getTime()
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

    const notification: Notification = {
      id: path,
      title: notificationFile.event,
      subject: notificationFile.subject,
      description: notificationFile.description ?? '',
      importance: this.fileImportanceToGqlImportance(notificationFile.importance),
      link: notificationFile.link,
      timestamp: this.parseNotificationDateToIsoDate(notificationFile.timestamp),
      type
    };

    return NotificationSchema().parse(notification);
  }

  private fileImportanceToGqlImportance(
    importance: NotificationIni['importance']
  ): Importance {
    switch (importance) {
      case 'alert':
        return Importance.ALERT;
      case 'warning':
        return Importance.WARNING;
      default:
        return Importance.INFO;
    }
  };

  private parseNotificationDateToIsoDate(
    unixStringSeconds: string | undefined
  ): string | null {
    if (unixStringSeconds && !isNaN(Number(unixStringSeconds))) {
      return new Date(Number(unixStringSeconds) * 1_000).toISOString();
    }
    return null;
  };
}
