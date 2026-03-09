// Unit Test File for NotificationsService: loadNotificationFile

import { ConfigService } from '@nestjs/config';
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

const { mockWatch } = vi.hoisted(() => {
    const watcher = {
        on: vi.fn().mockReturnThis(),
        close: vi.fn().mockResolvedValue(undefined),
    };

    return {
        mockWatch: vi.fn(() => watcher),
    };
});

// Mock fs/promises for unit tests
vi.mock('fs/promises', async () => {
    const actual = await vi.importActual<typeof import('fs/promises')>('fs/promises');
    const mockReadFile = vi.fn();
    const mockStat = vi.fn(actual.stat);
    return {
        ...actual,
        readFile: mockReadFile,
        stat: mockStat,
    };
});

vi.mock('chokidar', () => ({
    watch: mockWatch,
}));

// Mock getters.dynamix, Logger, and pubsub
vi.mock('@app/store/index.js', () => {
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

const createNotificationsService = (notificationPath = testNotificationsDir) => {
    const configService = new ConfigService({
        store: {
            dynamix: {
                notify: {
                    path: notificationPath,
                },
            },
        },
    });
    return new NotificationsService(configService);
};

describe('NotificationsService - loadNotificationFile (minimal mocks)', () => {
    let service: NotificationsService;
    let mockReadFile: typeof import('fs/promises').readFile;
    let mockStat: typeof import('fs/promises').stat;

    beforeEach(async () => {
        const fsPromises = await import('fs/promises');
        mockReadFile = fsPromises.readFile;
        mockStat = fsPromises.stat;
        vi.mocked(mockReadFile).mockClear();
        vi.mocked(mockStat).mockClear();
        mockWatch.mockClear();
        Reflect.set(NotificationsService, 'watcher', null);
        service = createNotificationsService();
        await Reflect.get(service, 'initialization');
    });

    afterEach(() => {
        Reflect.set(NotificationsService, 'watcher', null);
    });

    it('creates the notifications watcher without replaying existing files', () => {
        expect(mockWatch).toHaveBeenCalledWith(
            testNotificationsDir,
            expect.objectContaining({
                ignoreInitial: true,
            })
        );
    });

    it('replays buffered add events after overview hydration', async () => {
        const bufferedPath = `${testNotificationsDir}/unread/buffered.notify`;
        const hydratedService = createNotificationsService();
        const processNotificationAdd = vi.fn().mockResolvedValue(undefined);
        const handleNotificationAdd = (
            Reflect.get(hydratedService, 'handleNotificationAdd') as (path: string) => Promise<void>
        ).bind(hydratedService);

        Reflect.set(
            hydratedService,
            'ensureNotificationDirectories',
            vi.fn().mockResolvedValue(undefined)
        );
        Reflect.set(hydratedService, 'publishOverview', vi.fn().mockResolvedValue(undefined));
        Reflect.set(hydratedService, 'processNotificationAdd', processNotificationAdd);
        Reflect.set(
            hydratedService,
            'getNotificationsWatcher',
            vi.fn().mockImplementation(async () => {
                await handleNotificationAdd(bufferedPath);
                return {
                    close: vi.fn().mockResolvedValue(undefined),
                    on: vi.fn().mockReturnThis(),
                };
            })
        );
        Reflect.set(
            hydratedService,
            'buildOverviewSnapshot',
            vi.fn().mockResolvedValue({
                errorOccurred: false,
                overview: {
                    unread: { alert: 0, info: 0, warning: 0, total: 0 },
                    archive: { alert: 0, info: 0, warning: 0, total: 0 },
                },
                seenPaths: new Set<string>(),
            })
        );

        await Reflect.get(hydratedService, 'initializeNotificationsState').call(
            hydratedService,
            testNotificationsDir,
            true
        );

        expect(processNotificationAdd).toHaveBeenCalledWith(bufferedPath);
    });

    it('should load and validate a valid notification file', async () => {
        const mockFileContent = `timestamp=1609459200
event=Test Event
subject=Test Subject
description=Test Description
importance=alert
link=http://example.com`;

        vi.mocked(mockReadFile).mockResolvedValue(mockFileContent);

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
        const mockFileContent = `timestamp=1609459200
subject=Test Subject
description=Test Description
importance=alert`;

        vi.mocked(mockReadFile).mockResolvedValue(mockFileContent);

        const result = await (service as any).loadNotificationFile(
            '/test/path/invalid.notify',
            NotificationType.UNREAD
        );
        expect(result.id).toBe('invalid.notify');
        expect(result.importance).toBe(NotificationImportance.WARNING);
        expect(result.description).toContain('invalid and cannot be displayed');
    });

    it('should handle invalid enum values', async () => {
        const mockFileContent = `timestamp=1609459200
event=Test Event
subject=Test Subject
description=Test Description
importance=not-a-valid-enum`;

        vi.mocked(mockReadFile).mockResolvedValue(mockFileContent);

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
        const mockFileContent = `timestamp=1609459200
event=Test Event
subject=Test Subject
importance=normal`;

        vi.mocked(mockReadFile).mockResolvedValue(mockFileContent);

        const result = await (service as any).loadNotificationFile(
            '/test/path/test.notify',
            NotificationType.UNREAD
        );
        // Should be a masked warning notification
        expect(result.description).toContain('invalid and cannot be displayed');
        expect(result.importance).toBe(NotificationImportance.WARNING);
    });

    it('should preserve passthrough data from notification file (only known fields)', async () => {
        const mockFileContent = `timestamp=1609459200
event=Test Event
subject=Test Subject
description=Test Description
importance=normal
link=http://example.com
customField=custom value`;

        vi.mocked(mockReadFile).mockResolvedValue(mockFileContent);

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
        const mockFileContent = `event=Test Event
subject=Test Subject
description=Test Description
importance=alert`;

        vi.mocked(mockReadFile).mockResolvedValue(mockFileContent);

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
        const mockFileContent = `timestamp=not-a-timestamp
event=Test Event
subject=Test Subject
description=Test Description
importance=alert`;

        vi.mocked(mockReadFile).mockResolvedValue(mockFileContent);

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

    it('limits concurrent notification file reads', async () => {
        const fileCount = 96;
        const files = Array.from({ length: fileCount }, (_, index) => `/test/path/${index}.notify`);
        let activeReads = 0;
        let maxConcurrentReads = 0;

        vi.mocked(mockReadFile).mockImplementation(async () => {
            activeReads += 1;
            maxConcurrentReads = Math.max(maxConcurrentReads, activeReads);
            await new Promise((resolve) => setTimeout(resolve, 5));
            activeReads -= 1;
            return `timestamp=1609459200
event=Test Event
subject=Test Subject
description=Test Description
importance=alert`;
        });

        const [notifications] = await Reflect.get(service, 'loadNotificationsFromPaths').call(
            service,
            files,
            {}
        );

        expect(notifications).toHaveLength(fileCount);
        expect(maxConcurrentReads).toBeLessThanOrEqual(32);
    });

    it('surfaces stat failures when listing notification files', async () => {
        const unreadPath = join(testNotificationsDir, 'unread');
        const filePath = join(unreadPath, 'stat-failure.notify');
        writeFileSync(filePath, 'timestamp=1609459200');
        vi.mocked(mockStat).mockRejectedValueOnce(new Error('stat failed'));

        await expect(
            Reflect.get(service, 'listFilesInFolder').call(service, unreadPath)
        ).rejects.toThrow();
    });
});

describe('NotificationsService - deleteNotification (integration test)', () => {
    let service: NotificationsService;

    beforeEach(async () => {
        // Clean up any existing test directory
        if (existsSync(testNotificationsDir)) {
            rmSync(testNotificationsDir, { recursive: true, force: true });
        }

        // Create fresh directory structure
        mkdirSync(testNotificationsDir, { recursive: true });
        mkdirSync(join(testNotificationsDir, 'unread'), { recursive: true });
        mkdirSync(join(testNotificationsDir, 'archive'), { recursive: true });

        service = createNotificationsService();
        await Reflect.get(service, 'initialization');
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
