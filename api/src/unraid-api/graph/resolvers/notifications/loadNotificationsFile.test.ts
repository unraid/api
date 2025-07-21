// Unit Test File for NotificationsService: loadNotificationFile

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationIni } from '@app/core/types/states/notification.js';
import {
    Notification,
    NotificationImportance,
    NotificationType,
} from '@app/unraid-api/graph/resolvers/notifications/notifications.model.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

// Only mock getters.dynamix and Logger
vi.mock('@app/store/index.js', () => ({
    getters: {
        dynamix: vi.fn().mockReturnValue({
            notify: { path: '/test/notifications' },
            display: {
                date: 'Y-m-d',
                time: 'H:i:s',
            },
        }),
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
