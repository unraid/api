import { NotificationIni } from '@app/core/types/states/notification';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { NotificationSchema } from '@app/graphql/generated/api/operations';
import {Importance, NotificationType, type Notification, NotificationFilter,} from '@app/graphql/generated/api/types';
import { getters } from '@app/store';
import { Injectable } from '@nestjs/common';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { isFulfilled, isRejected } from '@app/utils';

@Injectable()
export class NotificationsService {
  private logger = new Logger(NotificationsService.name);

  /**
   * Retrieves all notifications from the file system.
   *
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
