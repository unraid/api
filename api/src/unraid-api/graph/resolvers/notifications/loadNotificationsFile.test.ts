// Unit Test File for NotificationsService: loadNotificationFile

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationIni } from '@app/core/types/states/notification.js';
import {
    Notification,
    NotificationImportance,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

// Mock getters.dynamix, Logger, and pubsub
vi.mock('@app/store/index.js', () => {
    // Create test directory path inside factory function
    const testNotificationsDir = join(tmpdir(), 'unraid-api-test-notifications');

    return {
        getters: {
            dynamix: vi.fn().mockReturnValue({
                notify: { path: testNotificationsDir },
                display: {
                    date: 'Y-m-d',
                    time: 'H:i:s',
                },
            }),
        },
    };
});

vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn(),
    },
    PUBSUB_CHANNEL: {
        NOTIFICATION_OVERVIEW: 'notification_overview',
        NOTIFICATION_ADDED: 'notification_added',
    },
}));

vi.mock('@nestjs/common', async (importOriginal) => {
    const original = await importOriginal<typeof import('@nestjs/common')>();
    return {
        ...original,
        Logger: vi.fn(() => ({
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn(),
        })),
    };
});

// Create a temporary test directory path for use in integration tests
const testNotificationsDir = join(tmpdir(), 'unraid-api-test-notifications');

describe('NotificationsService - loadNotificationFile (minimal mocks)', () => {
    let service: NotificationsService;

    beforeEach(() => {
        service = new NotificationsService();
    });

    it('should load and validate a valid notification file', async () => {
        const mockNotificationIni: NotificationIni = {
            timestamp: '1609459200',
            event: 'Test Event',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: 'alert',
            link: 'http://example.com',
        };

        vi.spyOn(await import('@app/core/utils/misc/parse-config.js'), 'parseConfig').mockReturnValue(
            mockNotificationIni
        );

        const result = await (service as any).loadNotificationFile(
            '/test/path/test.notify',
            NotificationType.UNREAD
        );
        expect(result).toEqual(
            expect.objectContaining({
                id: 'test.notify',
                type: NotificationType.UNREAD,
                title: 'Test Event',
                subject: 'Test Subject',
                description: 'Test Description',
                importance: NotificationImportance.ALERT,
                link: 'http://example.com',
                timestamp: '2021-01-01T00:00:00.000Z',
            })
        );
    });

    it('should return masked warning notification on validation error (missing required fields)', async () => {
        const invalidNotificationIni: Omit<NotificationIni, 'event'> = {
            timestamp: '1609459200',
            // event: 'Missing Event', // missing required field
            subject: 'Test Subject',
            description: 'Test Description',
            importance: 'alert',
        };

        vi.spyOn(await import('@app/core/utils/misc/parse-config.js'), 'parseConfig').mockReturnValue(
            invalidNotificationIni
        );

        const result = await (service as any).loadNotificationFile(
            '/test/path/invalid.notify',
            NotificationType.UNREAD
        );
        expect(result.id).toBe('invalid.notify');
        expect(result.importance).toBe(NotificationImportance.WARNING);
        expect(result.description).toContain('invalid and cannot be displayed');
    });

    it('should handle invalid enum values', async () => {
        const invalidNotificationIni: NotificationIni = {
            timestamp: '1609459200',
            event: 'Test Event',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: 'not-a-valid-enum' as any,
        };

        vi.spyOn(await import('@app/core/utils/misc/parse-config.js'), 'parseConfig').mockReturnValue(
            invalidNotificationIni
        );

        const result = await (service as any).loadNotificationFile(
            '/test/path/invalid-enum.notify',
            NotificationType.UNREAD
        );
        expect(result.id).toBe('invalid-enum.notify');
        // Implementation falls back to INFO for unknown importance
        expect(result.importance).toBe(NotificationImportance.INFO);
        // Should not be a masked warning notification, just fallback to INFO
        expect(result.description).toBe('Test Description');
    });

    it('should handle missing description field (should return masked warning notification)', async () => {
        const mockNotificationIni: Omit<NotificationIni, 'description'> = {
            timestamp: '1609459200',
            event: 'Test Event',
            subject: 'Test Subject',
            importance: 'normal',
        };

        vi.spyOn(await import('@app/core/utils/misc/parse-config.js'), 'parseConfig').mockReturnValue(
            mockNotificationIni
        );

        const result = await (service as any).loadNotificationFile(
            '/test/path/test.notify',
            NotificationType.UNREAD
        );
        // Should be a masked warning notification
        expect(result.description).toContain('invalid and cannot be displayed');
        expect(result.importance).toBe(NotificationImportance.WARNING);
    });

    it('should preserve passthrough data from notification file (only known fields)', async () => {
        const mockNotificationIni: NotificationIni & { customField: string } = {
            timestamp: '1609459200',
            event: 'Test Event',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: 'normal',
            link: 'http://example.com',
            customField: 'custom value',
        };

        vi.spyOn(await import('@app/core/utils/misc/parse-config.js'), 'parseConfig').mockReturnValue(
            mockNotificationIni
        );

        const result = await (service as any).loadNotificationFile(
            '/test/path/test.notify',
            NotificationType.UNREAD
        );
        expect(result).toEqual(
            expect.objectContaining({
                link: 'http://example.com',
                // customField should NOT be present
                description: 'Test Description',
                id: 'test.notify',
                type: NotificationType.UNREAD,
                title: 'Test Event',
                subject: 'Test Subject',
                importance: NotificationImportance.INFO,
                timestamp: '2021-01-01T00:00:00.000Z',
            })
        );
        expect((result as any).customField).toBeUndefined();
    });

    it('should handle missing timestamp field gracefully', async () => {
        const mockNotificationIni: Omit<NotificationIni, 'timestamp'> = {
            // timestamp is missing
            event: 'Test Event',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: 'alert',
        };

        vi.spyOn(await import('@app/core/utils/misc/parse-config.js'), 'parseConfig').mockReturnValue(
            mockNotificationIni
        );

        const result = await (service as any).loadNotificationFile(
            '/test/path/missing-timestamp.notify',
            NotificationType.UNREAD
        );
        expect(result.id).toBe('missing-timestamp.notify');
        expect(result.importance).toBe(NotificationImportance.ALERT);
        expect(result.description).toBe('Test Description');
        expect(result.timestamp).toBeUndefined(); // Missing timestamp results in undefined
        expect(result.formattedTimestamp).toBe(undefined); // Also undefined since timestamp is missing
    });

    it('should handle malformed timestamp field gracefully', async () => {
        const mockNotificationIni: NotificationIni = {
            timestamp: 'not-a-timestamp',
            event: 'Test Event',
            subject: 'Test Subject',
            description: 'Test Description',
            importance: 'alert',
        };

        vi.spyOn(await import('@app/core/utils/misc/parse-config.js'), 'parseConfig').mockReturnValue(
            mockNotificationIni
        );

        const result = await (service as any).loadNotificationFile(
            '/test/path/malformed-timestamp.notify',
            NotificationType.UNREAD
        );
        expect(result.id).toBe('malformed-timestamp.notify');
        expect(result.importance).toBe(NotificationImportance.ALERT);
        expect(result.description).toBe('Test Description');
        expect(result.timestamp).toBeUndefined(); // Malformed timestamp results in undefined
        expect(result.formattedTimestamp).toBe('not-a-timestamp'); // Returns original string when parsing fails
    });
});

describe('NotificationsService - deleteNotification (integration test)', () => {
    let service: NotificationsService;

    beforeEach(() => {
        // Clean up any existing test directory
        if (existsSync(testNotificationsDir)) {
            rmSync(testNotificationsDir, { recursive: true, force: true });
        }

        // Create fresh directory structure
        mkdirSync(testNotificationsDir, { recursive: true });
        mkdirSync(join(testNotificationsDir, 'unread'), { recursive: true });
        mkdirSync(join(testNotificationsDir, 'archive'), { recursive: true });

        service = new NotificationsService();
    });

    afterEach(() => {
        // Clean up after each test
        if (existsSync(testNotificationsDir)) {
            rmSync(testNotificationsDir, { recursive: true, force: true });
        }
    });

    it('should successfully delete an invalid notification file from disk', async () => {
        // Create a truly invalid notification with only timestamp - missing all required fields
        const invalidNotificationContent = `
timestamp=1609459200
        `.trim();

        const notificationId = 'invalid-test.notify';
        const filePath = join(testNotificationsDir, 'unread', notificationId);

        // Create actual invalid notification file on disk
        writeFileSync(filePath, invalidNotificationContent);

        // Verify file exists before deletion
        expect(existsSync(filePath)).toBe(true);

        const result = await service.deleteNotification({
            id: notificationId,
            type: NotificationType.UNREAD,
        });

        // The key integration test: verify file was actually deleted from disk
        expect(existsSync(filePath)).toBe(false);

        // Verify the service returns a notification object (even if mocked content)
        expect(result.notification).toBeDefined();
        expect(result.notification.id).toBe(notificationId);
        expect(result.notification.type).toBe(NotificationType.UNREAD);

        // Verify overview is returned and updated
        expect(result.overview).toBeDefined();
        expect(result.overview.unread).toBeDefined();
        expect(result.overview.archive).toBeDefined();

        // The service should be able to handle deletion of any file, valid or invalid
        expect(result.notification.importance).toMatch(/ALERT|WARNING|INFO/);
    });
});
