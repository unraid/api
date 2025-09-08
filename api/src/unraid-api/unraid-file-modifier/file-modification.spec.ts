import { Logger } from '@nestjs/common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as getUnraidVersionModule from '@app/common/dashboard/get-unraid-version.js';
import { FileModification } from '@app/unraid-api/unraid-file-modifier/file-modification.js';

vi.mock('@app/common/dashboard/get-unraid-version.js');

class TestFileModification extends FileModification {
    id = 'test';
    filePath = '/test/file';

    protected async generatePatch(): Promise<string> {
        return 'test patch';
    }
}

describe('FileModification', () => {
    let modification: TestFileModification;
    let getUnraidVersionMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        const logger = new Logger('TestFileModification');
        modification = new TestFileModification(logger);
        getUnraidVersionMock = vi.mocked(getUnraidVersionModule.getUnraidVersion);
    });

    describe('version comparison methods', () => {
        describe('isUnraidVersionGreaterThanOrEqualTo', () => {
            it('should return true when current version is greater', async () => {
                getUnraidVersionMock.mockResolvedValue('7.3.0');
                const result = await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0');
                expect(result).toBe(true);
            });

            it('should return true when current version is equal', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0');
                const result = await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0');
                expect(result).toBe(true);
            });

            it('should return false when current version is less', async () => {
                getUnraidVersionMock.mockResolvedValue('7.1.0');
                const result = await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0');
                expect(result).toBe(false);
            });

            it('should handle prerelease versions correctly', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.1');
                const result = await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0-beta.1');
                expect(result).toBe(true);
            });

            it('should treat prerelease as greater than stable when base versions are equal', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.1');
                const result = await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0', {
                    includePrerelease: true,
                });
                expect(result).toBe(true);
            });

            it('should compare prerelease versions correctly', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.2.4');
                const result =
                    await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0-beta.2.3');
                expect(result).toBe(true);
            });

            it('should handle beta.2.3 being less than beta.2.4', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.2.3');
                const result =
                    await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0-beta.2.4');
                expect(result).toBe(false);
            });
        });

        describe('isUnraidVersionLessThanOrEqualTo', () => {
            it('should return true when current version is less', async () => {
                getUnraidVersionMock.mockResolvedValue('7.1.0');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0');
                expect(result).toBe(true);
            });

            it('should return true when current version is equal', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0');
                expect(result).toBe(true);
            });

            it('should return false when current version is greater', async () => {
                getUnraidVersionMock.mockResolvedValue('7.3.0');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0');
                expect(result).toBe(false);
            });

            it('should handle prerelease versions correctly', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.1');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0-beta.1');
                expect(result).toBe(true);
            });

            it('should treat prerelease as less than stable when base versions are equal', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.1');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0', {
                    includePrerelease: true,
                });
                expect(result).toBe(false);
            });

            it('should compare prerelease versions correctly', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.2.3');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0-beta.2.4');
                expect(result).toBe(true);
            });

            it('should handle beta.2.3 being equal to beta.2.3', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.2.3');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0-beta.2.3');
                expect(result).toBe(true);
            });

            it('should handle beta.2.4 being greater than beta.2.3', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0-beta.2.4');
                const result = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0-beta.2.3');
                expect(result).toBe(false);
            });
        });

        describe('inverse relationship', () => {
            it('should have opposite results for greater-than-or-equal and less-than-or-equal when not equal', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.5');
                const gte = await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0');
                const lte = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0');
                expect(gte).toBe(true);
                expect(lte).toBe(false);
            });

            it('should both return true when versions are equal', async () => {
                getUnraidVersionMock.mockResolvedValue('7.2.0');
                const gte = await modification['isUnraidVersionGreaterThanOrEqualTo']('7.2.0');
                const lte = await modification['isUnraidVersionLessThanOrEqualTo']('7.2.0');
                expect(gte).toBe(true);
                expect(lte).toBe(true);
            });
        });
    });
});
