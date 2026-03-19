import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';

import { writeFile as atomicWriteFile } from 'atomically';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.service.js';

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

vi.mock('atomically', () => ({
    writeFile: vi.fn(),
}));

const mockReadFile = vi.mocked(readFile);
const mockAtomicWriteFile = vi.mocked(atomicWriteFile);

const createConfigService = (dataDir = '/tmp/unraid-data') => {
    const set = vi.fn();
    const get = vi.fn((key: string) => {
        if (key === 'PATHS_UNRAID_DATA') {
            return dataDir;
        }
        return undefined;
    });

    return {
        set,
        get,
    } as unknown as ConfigService;
};

describe('OnboardingTrackerService write retries', () => {
    beforeEach(() => {
        mockReadFile.mockReset();
        mockAtomicWriteFile.mockReset();
    });

    it('retries failed writes and succeeds on a later attempt', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        mockAtomicWriteFile
            .mockRejectedValueOnce(new Error('transient-write-failure-1'))
            .mockRejectedValueOnce(new Error('transient-write-failure-2'))
            .mockResolvedValue(undefined as never);

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        const result = await tracker.markCompleted();

        expect(result.completed).toBe(true);
        expect(result.completedAtVersion).toBe('7.2.0');
        expect(mockAtomicWriteFile).toHaveBeenCalledTimes(3);
    });

    it('throws when all write retries fail', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        mockAtomicWriteFile.mockImplementation(async () =>
            Promise.reject(new Error('persistent-write-failure'))
        );

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        await expect(tracker.markCompleted()).rejects.toThrow('persistent-write-failure');
        expect(mockAtomicWriteFile).toHaveBeenCalledTimes(3);
    });
});

describe('OnboardingTrackerService tracker state availability', () => {
    beforeEach(() => {
        mockReadFile.mockReset();
        mockAtomicWriteFile.mockReset();
    });

    it('treats a missing tracker file as a valid empty onboarding state', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        await expect(tracker.getStateResult()).resolves.toEqual({
            kind: 'missing',
            state: {
                completed: false,
                completedAtVersion: undefined,
                forceOpen: false,
            },
        });
    });

    it('captures tracker read failures when reading the tracker file fails for a non-ENOENT reason', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw new Error('permission denied');
        });

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        const stateResult = await tracker.getStateResult();
        expect(stateResult.kind).toBe('error');
        if (stateResult.kind === 'error') {
            expect(stateResult.error).toBeInstanceOf(Error);
        }
    });

    it('returns override-backed onboarding state as a successful read result', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        overrides.setState({
            onboarding: {
                completed: true,
                completedAtVersion: '7.2.0',
            },
        });

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        await expect(tracker.getStateResult()).resolves.toEqual({
            kind: 'ok',
            state: {
                completed: true,
                completedAtVersion: '7.2.0',
                forceOpen: false,
            },
        });
    });

    it('clears forceOpen when marking override-backed onboarding completed', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        overrides.setState({
            onboarding: {
                completed: false,
                completedAtVersion: undefined,
                forceOpen: true,
            },
        });

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        await expect(tracker.markCompleted()).resolves.toEqual({
            completed: true,
            completedAtVersion: '7.2.0',
            forceOpen: false,
        });
    });

    it('clears forceOpen when resetting override-backed onboarding state', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        overrides.setState({
            onboarding: {
                completed: true,
                completedAtVersion: '7.2.0',
                forceOpen: true,
            },
        });

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
        });

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        await expect(tracker.reset()).resolves.toEqual({
            completed: false,
            completedAtVersion: undefined,
            forceOpen: false,
        });
    });

    it('propagates tracker read failures through isCompleted', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw new Error('permission denied');
        });

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        await expect(tracker.isCompleted()).rejects.toThrow('permission denied');
    });

    it('propagates tracker read failures through getCompletedAtVersion', async () => {
        const config = createConfigService();
        const overrides = new OnboardingOverrideService();

        mockReadFile.mockImplementation(async (filePath) => {
            if (String(filePath).includes('unraid-version')) {
                return 'version="7.2.0"\n';
            }
            throw new Error('permission denied');
        });

        const tracker = new OnboardingTrackerService(config, overrides);
        await tracker.onApplicationBootstrap();

        await expect(tracker.getCompletedAtVersion()).rejects.toThrow('permission denied');
    });
});
