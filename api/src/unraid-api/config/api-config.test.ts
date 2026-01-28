import { ConfigService } from '@nestjs/config';
import { access, readdir, readFile, unlink, writeFile as writeFileFs } from 'fs/promises';
import path from 'path';

import type { ApiConfig } from '@unraid/shared/services/api-config.js';
import { writeFile as atomicWriteFile } from 'atomically';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_VERSION, PATHS_CONFIG_MODULES } from '@app/environment.js';
import { ApiConfigPersistence, loadApiConfig } from '@app/unraid-api/config/api-config.module.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingStateService } from '@app/unraid-api/config/onboarding-state.service.js';
import {
    OnboardingTrackerService,
    UPGRADE_MARKER_PATH,
} from '@app/unraid-api/config/onboarding-tracker.module.js';

vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn(),
}));

vi.mock('@unraid/shared/util/file.js', () => ({
    fileExists: vi.fn(),
}));

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
}));

const mockEmhttpState = { var: { regState: 'PRO' } } as any;
const mockPathsState = { activationBase: '/activation' } as any;

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(() => mockEmhttpState),
        paths: vi.fn(() => mockPathsState),
    },
}));

vi.mock('atomically', () => ({
    writeFile: vi.fn(),
}));

const mockReadFile = vi.mocked(readFile);
const mockReaddir = vi.mocked(readdir);
const mockAccess = vi.mocked(access);
const mockWriteFileFs = vi.mocked(writeFileFs);
const mockUnlink = vi.mocked(unlink);
const mockAtomicWriteFile = vi.mocked(atomicWriteFile);
type ReaddirResult = Awaited<ReturnType<typeof readdir>>;

const createOnboardingTracker = (configService: ConfigService) => {
    const overrides = new OnboardingOverrideService();
    const onboardingState = new OnboardingStateService(overrides);
    return new OnboardingTrackerService(configService, overrides, onboardingState);
};

describe('ApiConfigPersistence', () => {
    let service: ApiConfigPersistence;
    let configService: ConfigService;
    let configChanges$: Subject<{ path?: string }>;
    let setMock: ReturnType<typeof vi.fn>;
    let getMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        configChanges$ = new Subject<{ path?: string }>();
        setMock = vi.fn();
        getMock = vi.fn();

        configService = {
            get: getMock,
            set: setMock,
            getOrThrow: vi.fn().mockReturnValue('test-config-path'),
            changes$: configChanges$,
        } as any;

        service = new ApiConfigPersistence(configService);
    });

    it('should return correct file name', () => {
        expect(service.fileName()).toBe('api.json');
    });

    it('should return correct config key', () => {
        expect(service.configKey()).toBe('api');
    });

    it('should return default config', () => {
        const defaultConfig = service.defaultConfig();
        expect(defaultConfig).toEqual({
            version: API_VERSION,
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });

    it('should migrate config from legacy format', async () => {
        const legacyConfig = {
            local: { sandbox: 'yes' },
            api: { extraOrigins: 'https://example.com,https://test.com' },
            remote: { ssoSubIds: 'sub1,sub2' },
        };

        getMock.mockImplementation((key: string) => {
            if (key === 'store.config') {
                return legacyConfig;
            }
            return undefined;
        });

        const result = await service.migrateConfig();

        expect(result).toEqual({
            version: API_VERSION,
            extraOrigins: ['https://example.com', 'https://test.com'],
            sandbox: true,
            ssoSubIds: ['sub1', 'sub2'],
            plugins: [],
        });
    });

    it('sets api.version on bootstrap', async () => {
        await service.onApplicationBootstrap();
        expect(setMock).toHaveBeenCalledWith('api.version', API_VERSION);
    });
});

describe('OnboardingTracker', () => {
    const trackerPath = path.join(PATHS_CONFIG_MODULES, 'onboarding-tracker.json');
    const dataDir = '/tmp/unraid-data';
    const versionFilePath = path.join(dataDir, 'unraid-version');
    let configService: ConfigService;
    let setMock: ReturnType<typeof vi.fn>;
    let configStore: Record<string, unknown>;

    beforeEach(() => {
        configStore = {};
        setMock = vi.fn((key: string, value: unknown) => {
            configStore[key] = value;
        });
        configStore['PATHS_UNRAID_DATA'] = dataDir;
        configService = {
            set: setMock,
            get: vi.fn((key: string) => configStore[key]),
            getOrThrow: vi.fn(),
        } as any;

        mockReadFile.mockReset();
        mockReaddir.mockReset();
        mockAccess.mockReset();
        mockReaddir.mockResolvedValue([] as unknown as ReaddirResult);
        mockAccess.mockResolvedValue(undefined);
        mockAtomicWriteFile.mockReset();
        mockWriteFileFs.mockReset();
        mockWriteFileFs.mockResolvedValue(undefined);
        mockUnlink.mockReset();
        mockUnlink.mockResolvedValue(undefined);

        mockEmhttpState.var.regState = 'PRO';
        mockPathsState.activationBase = '/activation';
    });

    it('marks first boot as completed when no prior state exists', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === trackerPath) {
                throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
            }
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            if (filePath === UPGRADE_MARKER_PATH) {
                throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        const alreadyCompleted = await tracker.ensureFirstBootCompleted();

        expect(alreadyCompleted).toBe(false);
        expect(mockAtomicWriteFile).toHaveBeenCalledWith(
            trackerPath,
            expect.stringContaining('"firstBootCompletedAt"'),
            { mode: 0o644 }
        );
        expect(setMock).toHaveBeenCalledWith(
            'onboardingTracker.firstBootCompletedAt',
            expect.any(String)
        );
    });

    it('returns true when first boot was already recorded', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === trackerPath) {
                return JSON.stringify({
                    firstBootCompletedAt: '2025-01-01T00:00:00.000Z',
                });
            }
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            if (filePath === UPGRADE_MARKER_PATH) {
                throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        const alreadyCompleted = await tracker.ensureFirstBootCompleted();

        expect(alreadyCompleted).toBe(true);
        expect(mockAtomicWriteFile).not.toHaveBeenCalled();
        expect(setMock).toHaveBeenCalledWith(
            'onboardingTracker.firstBootCompletedAt',
            '2025-01-01T00:00:00.000Z'
        );
    });

    it('keeps previous version available until onboarding is completed', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '6.12.0',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    completedVersions: [],
                });
            }
            if (filePath === UPGRADE_MARKER_PATH) {
                throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const snapshot = await tracker.getUpgradeSnapshot();
        expect(snapshot.currentVersion).toBe('7.2.0');
        expect(snapshot.lastTrackedVersion).toBe('6.12.0');
        expect(snapshot.completed).toBe(false);
    });

    it('marks onboarding as completed', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '6.12.0',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    completedVersions: [],
                });
            }
            if (filePath === UPGRADE_MARKER_PATH) {
                throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const snapshot = await tracker.markOnboardingCompleted();

        expect(snapshot.completed).toBe(true);
        expect(mockAtomicWriteFile).toHaveBeenCalledWith(
            trackerPath,
            expect.stringContaining('"7.2.0"'),
            { mode: 0o644 }
        );
    });

    it('handles missing version file gracefully', async () => {
        mockReadFile.mockRejectedValue(new Error('permission denied'));

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        expect(setMock).toHaveBeenCalledWith('onboardingTracker.currentVersion', undefined);
        expect(setMock).toHaveBeenCalledWith('store.emhttp.var.version', undefined);
        expect(mockAtomicWriteFile).not.toHaveBeenCalled();
        expect(mockWriteFileFs).not.toHaveBeenCalled();
    });
});

describe('loadApiConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return default config with current API_VERSION', async () => {
        const result = await loadApiConfig();

        expect(result).toEqual({
            version: API_VERSION,
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });

    it('should handle errors gracefully and return defaults', async () => {
        const result = await loadApiConfig();

        expect(result).toEqual({
            version: API_VERSION,
            extraOrigins: [],
            sandbox: false,
            ssoSubIds: [],
            plugins: [],
        });
    });
});
