import { ConfigService } from '@nestjs/config';
import { access, readdir, readFile } from 'fs/promises';
import path from 'path';

import type { ApiConfig } from '@unraid/shared/services/api-config.js';
import { writeFile as atomicWriteFile } from 'atomically';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_VERSION, PATHS_CONFIG_MODULES } from '@app/environment.js';
import { ApiConfigPersistence, loadApiConfig } from '@app/unraid-api/config/api-config.module.js';
import { OnboardingTracker } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';

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
const mockAtomicWriteFile = vi.mocked(atomicWriteFile);

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
        expect(defaultConfig.lastSeenOsVersion).toBeUndefined();
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
        expect(result.lastSeenOsVersion).toBeUndefined();
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
        mockReaddir.mockResolvedValue([]);
        mockAccess.mockResolvedValue(undefined);
        mockAtomicWriteFile.mockReset();

        mockEmhttpState.var.regState = 'PRO';
        mockPathsState.activationBase = '/activation';
    });

    it('defers persisting last seen version until shutdown', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.2.0-beta.3.4"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        expect(setMock).toHaveBeenCalledWith('onboardingTracker.currentVersion', '7.2.0-beta.3.4');
        expect(setMock).toHaveBeenCalledWith('store.emhttp.var.version', '7.2.0-beta.3.4');
        expect(setMock).toHaveBeenCalledWith('onboardingTracker.lastTrackedVersion', undefined);
        expect(setMock).toHaveBeenCalledWith('onboardingTracker.completedSteps', {});
        expect(configStore['api.lastSeenOsVersion']).toBeUndefined();
        expect(mockAtomicWriteFile).not.toHaveBeenCalled();

        await tracker.onApplicationShutdown();

        expect(mockAtomicWriteFile).toHaveBeenCalledWith(
            trackerPath,
            expect.stringContaining('"lastTrackedVersion": "7.2.0-beta.3.4"'),
            { mode: 0o644 }
        );
    });

    it('does not rewrite when version has not changed', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="6.12.0"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '6.12.0',
                    updatedAt: '2024-01-01T00:00:00.000Z',
                    completedSteps: {
                        TIMEZONE: {
                            version: '6.12.0',
                            completedAt: '2024-01-02T00:00:00.000Z',
                        },
                    },
                });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        expect(setMock).toHaveBeenCalledWith('onboardingTracker.currentVersion', '6.12.0');
        expect(setMock).toHaveBeenCalledWith('store.emhttp.var.version', '6.12.0');
        expect(setMock).toHaveBeenCalledWith('onboardingTracker.lastTrackedVersion', '6.12.0');
        expect(setMock).toHaveBeenCalledWith(
            'onboardingTracker.completedSteps',
            expect.objectContaining({
                TIMEZONE: expect.objectContaining({ version: '6.12.0' }),
            })
        );
        expect(configStore['api.lastSeenOsVersion']).toBe('6.12.0');
        expect(mockAtomicWriteFile).not.toHaveBeenCalled();

        await tracker.onApplicationShutdown();

        expect(mockAtomicWriteFile).not.toHaveBeenCalled();
    });

    it('falls back to default version path when data directory is unavailable', async () => {
        delete configStore['PATHS_UNRAID_DATA'];

        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === '/etc/unraid-version') {
                return 'version="7.3.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        expect(setMock).toHaveBeenCalledWith('onboardingTracker.currentVersion', '7.3.0');
    });

    it('keeps previous version available to signal upgrade until shutdown', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.1.0"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '7.0.0',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    completedSteps: {},
                });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const snapshot = await tracker.getUpgradeSnapshot();
        expect(snapshot.currentVersion).toBe('7.1.0');
        expect(snapshot.lastTrackedVersion).toBe('7.0.0');
        expect(snapshot.completedSteps).toEqual([]);
        expect(snapshot.steps.map((step) => step.id)).toEqual([
            ActivationOnboardingStepId.WELCOME,
            ActivationOnboardingStepId.TIMEZONE,
            ActivationOnboardingStepId.PLUGINS,
        ]);
        expect(snapshot.steps.every((step) => step.id && step.introducedIn)).toBe(true);

        expect(configStore['onboardingTracker.lastTrackedVersion']).toBe('7.0.0');
        expect(configStore['store.emhttp.var.version']).toBe('7.1.0');
        expect(configStore['onboardingTracker.completedSteps']).toEqual({});
        expect(configStore['api.lastSeenOsVersion']).toBe('7.0.0');

        expect(mockAtomicWriteFile).not.toHaveBeenCalled();
    });

    it('handles missing version file gracefully', async () => {
        mockReadFile.mockRejectedValue(new Error('permission denied'));

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        expect(setMock).toHaveBeenCalledWith('onboardingTracker.currentVersion', undefined);
        expect(setMock).toHaveBeenCalledWith('store.emhttp.var.version', undefined);
        expect(setMock).toHaveBeenCalledWith('onboardingTracker.lastTrackedVersion', undefined);
        expect(setMock).toHaveBeenCalledWith('onboardingTracker.completedSteps', {});
        expect(mockAtomicWriteFile).not.toHaveBeenCalled();
        expect(configStore['api.lastSeenOsVersion']).toBeUndefined();
    });

    it('marks onboarding steps complete for the current version without clearing upgrade flag', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.2.0"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '6.12.0',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    completedSteps: {},
                });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        expect(configStore['store.emhttp.var.version']).toBe('7.2.0');
        expect(configStore['onboardingTracker.lastTrackedVersion']).toBe('6.12.0');
        expect(configStore['api.lastSeenOsVersion']).toBe('6.12.0');

        setMock.mockClear();
        mockAtomicWriteFile.mockReset();

        const snapshot = await tracker.markStepCompleted(ActivationOnboardingStepId.TIMEZONE);

        expect(snapshot.currentVersion).toBe('7.2.0');
        expect(snapshot.completedSteps).toContain(ActivationOnboardingStepId.TIMEZONE);
        expect(snapshot.lastTrackedVersion).toBe('6.12.0');
        expect(snapshot.steps.map((step) => step.id)).toEqual([
            ActivationOnboardingStepId.WELCOME,
            ActivationOnboardingStepId.TIMEZONE,
            ActivationOnboardingStepId.PLUGINS,
        ]);

        expect(mockAtomicWriteFile).toHaveBeenCalledWith(
            trackerPath,
            expect.stringContaining('"TIMEZONE"'),
            { mode: 0o644 }
        );

        expect(setMock).toHaveBeenCalledWith(
            'onboardingTracker.completedSteps',
            expect.objectContaining({
                TIMEZONE: expect.objectContaining({ version: '7.0.0' }),
            })
        );

        expect(setMock).toHaveBeenCalledWith('onboardingTracker.lastTrackedVersion', '6.12.0');

        const postSnapshot = await tracker.getUpgradeSnapshot();
        expect(postSnapshot.lastTrackedVersion).toBe('6.12.0');
        expect(postSnapshot.steps.map((step) => step.id)).toEqual([
            ActivationOnboardingStepId.WELCOME,
            ActivationOnboardingStepId.TIMEZONE,
            ActivationOnboardingStepId.PLUGINS,
        ]);
    });

    it('retains completed steps across patch upgrades when definitions are unchanged', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.0.1"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '7.0.0',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    completedSteps: {
                        TIMEZONE: {
                            version: '7.0.0',
                            completedAt: '2025-01-02T00:00:00.000Z',
                        },
                    },
                });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const snapshot = await tracker.getUpgradeSnapshot();
        expect(snapshot.currentVersion).toBe('7.0.1');
        expect(snapshot.lastTrackedVersion).toBe('7.0.0');
        expect(snapshot.completedSteps).toContain(ActivationOnboardingStepId.TIMEZONE);
        expect(snapshot.steps.map((step) => step.id)).toEqual([
            ActivationOnboardingStepId.WELCOME,
            ActivationOnboardingStepId.TIMEZONE,
            ActivationOnboardingStepId.PLUGINS,
        ]);
    });

    it('surfaces steps when stored completion predates the definition version', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.0.0"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '6.12.0',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    completedSteps: {
                        TIMEZONE: {
                            version: '6.11.0',
                            completedAt: '2024-12-31T23:59:59.000Z',
                        },
                    },
                });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const snapshot = await tracker.getUpgradeSnapshot();
        expect(snapshot.currentVersion).toBe('7.0.0');
        expect(snapshot.lastTrackedVersion).toBe('6.12.0');
        expect(snapshot.completedSteps).not.toContain(ActivationOnboardingStepId.TIMEZONE);
        expect(snapshot.steps.map((step) => step.id)).toEqual([
            ActivationOnboardingStepId.WELCOME,
            ActivationOnboardingStepId.TIMEZONE,
            ActivationOnboardingStepId.PLUGINS,
        ]);
    });

    it('includes activation step when activation code is present and registration is pending', async () => {
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath === versionFilePath) {
                return 'version="7.0.1"\n';
            }
            if (filePath === trackerPath) {
                return JSON.stringify({
                    lastTrackedVersion: '7.0.0',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    completedSteps: {},
                });
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        mockReaddir.mockResolvedValueOnce(['pending.activationcode']);
        mockEmhttpState.var.regState = 'ENOKEYFILE';

        const tracker = new OnboardingTracker(configService);
        await tracker.onApplicationBootstrap();

        const snapshot = await tracker.getUpgradeSnapshot();
        expect(snapshot.steps.map((step) => step.id)).toEqual([
            ActivationOnboardingStepId.WELCOME,
            ActivationOnboardingStepId.TIMEZONE,
            ActivationOnboardingStepId.PLUGINS,
            ActivationOnboardingStepId.ACTIVATION,
        ]);
        const activationStep = snapshot.steps.find(
            (step) => step.id === ActivationOnboardingStepId.ACTIVATION
        );
        expect(activationStep).toBeDefined();
        expect(activationStep?.required).toBe(true);
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
        expect(result.lastSeenOsVersion).toBeUndefined();
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
        expect(result.lastSeenOsVersion).toBeUndefined();
    });
});
