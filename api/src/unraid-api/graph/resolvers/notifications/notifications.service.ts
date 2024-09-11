import { NotificationIni } from '@app/core/types/states/notification';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { NotificationSchema } from '@app/graphql/generated/api/operations';
import { Importance, NotificationType, type Notification, } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';
import { Injectable } from '@nestjs/common';
import { readdir, stat } from 'fs/promises';
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
  public async getNotifications(): Promise<Notification[]> {
    this.logger.debug('Getting Notifications');
    const logErrors = (error: unknown) => this.logger.error(error);

    const notificationBasePath = getters.dynamix().notify!.path;

    const [unreadNotifications, unreadNotificationErrors] = await this.getUnreadNotifications(notificationBasePath);

    this.logger.debug(`${unreadNotifications.length} Unread Notifications`);
    this.logger.debug(`${unreadNotificationErrors.length} Unread Notification Errors`);
    unreadNotificationErrors.forEach(logErrors);

    const [archivedNotifications, archivedNotificationErrors] = await this.getArchiveNotifications(notificationBasePath);

    this.logger.debug(`${archivedNotifications.length} Archived Notifications`);
    this.logger.debug(`${archivedNotificationErrors.length} Archived Notification Errors`);
    archivedNotificationErrors.forEach(logErrors);

    return [...unreadNotifications, ...archivedNotifications];
  }

  private getUnreadNotifications(notificationsDirectory: string) {
    const unreadsDirectoryPath = join(notificationsDirectory, NotificationType.UNREAD.toLowerCase());
    return this.getNotificationsFromDirectory(unreadsDirectoryPath, NotificationType.UNREAD);
  }

  private getArchiveNotifications(notificationsDirectory: string) {
    const archivedDirectoryPath = join(notificationsDirectory, NotificationType.ARCHIVE.toLowerCase());
    return this.getNotificationsFromDirectory(archivedDirectoryPath, NotificationType.ARCHIVE);
  }

  /**
   * Given a directory path, reads all the files in the directory,
   * and attempts to parse each file as a Notification.
   * Returns an array of two elements:
   * - the first element is an array of successfully parsed Notifications,
   * - the second element is an array of errors for any files that failed parsing.
   * @param containingDirectory the directory to read
   * @param type the type of notification to load
   * @returns an array of two elements: [successes, errors/failures]
   */
  private async getNotificationsFromDirectory(containingDirectory: string, type: NotificationType): Promise<[Notification[], unknown[]]> {
    const loadNotification = (filePath: string) => this.loadNotificationFile(filePath, type);

    const contents = await readdir(containingDirectory);
    const absolutePaths = contents.map((content) => join(containingDirectory, content));
    const fileReads = absolutePaths.map(loadNotification);
    const results = await Promise.allSettled(fileReads);

    return [
      results.filter(isFulfilled).map((result) => result.value),
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
