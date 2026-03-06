import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import path from 'path';

import type { ApiConfig } from '@unraid/shared/services/api-config.js';
import { writeFile as atomicWriteFile } from 'atomically';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_VERSION, PATHS_CONFIG_MODULES } from '@app/environment.js';
import { ApiConfigPersistence, loadApiConfig } from '@app/unraid-api/config/api-config.module.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';

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
const mockAtomicWriteFile = vi.mocked(atomicWriteFile);

const createOnboardingTracker = (configService: ConfigService) => {
    const overrides = new OnboardingOverrideService();
    return new OnboardingTrackerService(configService, overrides);
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
        mockAtomicWriteFile.mockReset();

        mockEmhttpState.var.regState = 'PRO';
        mockPathsState.activationBase = '/activation';
    });

    it('returns not completed when no prior state exists', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === trackerPath) {
                throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
            }
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const state = tracker.getState();
        expect(state.completed).toBe(false);
        expect(state.completedAtVersion).toBeUndefined();
    });

    it('returns completed state when previously marked', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === trackerPath) {
                return JSON.stringify({
                    completed: true,
                    completedAtVersion: '7.1.0',
                });
            }
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const state = tracker.getState();
        expect(state.completed).toBe(true);
        expect(state.completedAtVersion).toBe('7.1.0');
    });

    it('marks onboarding as completed with current version', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            if (filePath === trackerPath) {
                throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const result = await tracker.markCompleted();

        expect(result.completed).toBe(true);
        expect(result.completedAtVersion).toBe('7.2.0');
        expect(mockAtomicWriteFile).toHaveBeenCalledWith(
            trackerPath,
            expect.stringContaining('"completed": true'),
            { mode: 0o644 }
        );
    });

    it('resets onboarding state', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === trackerPath) {
                return JSON.stringify({
                    completed: true,
                    completedAtVersion: '7.1.0',
                });
            }
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const result = await tracker.reset();

        expect(result.completed).toBe(false);
        expect(result.completedAtVersion).toBeUndefined();
    });

    it('handles missing version file gracefully', async () => {
        mockReadFile.mockRejectedValue(new Error('permission denied'));

        const tracker = createOnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        expect(setMock).toHaveBeenCalledWith('onboardingTracker.currentVersion', undefined);
    });

    it('respects override state', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === trackerPath) {
                return JSON.stringify({
                    completed: false,
                    completedAtVersion: undefined,
                });
            }
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const overrides = new OnboardingOverrideService();
        overrides.setState({
            onboarding: {
                completed: true,
                completedAtVersion: '6.12.0',
            },
        });

        const tracker = new OnboardingTrackerService(configService, overrides);
        await tracker.onApplicationBootstrap();

        const state = tracker.getState();
        expect(state.completed).toBe(true);
        expect(state.completedAtVersion).toBe('6.12.0');
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
