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
