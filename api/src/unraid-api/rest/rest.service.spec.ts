import { Test, TestingModule } from '@nestjs/testing';
import type { ReadStream } from 'node:fs';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

vi.mock('node:fs');
vi.mock('@app/core/utils/images/image-file-helpers.js', () => ({
    getBannerPathIfPresent: vi.fn(),
    getCasePathIfPresent: vi.fn(),
}));

describe('RestService', () => {
    let service: RestService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [RestService],
        }).compile();

        service = module.get<RestService>(RestService);
    });

    describe('getCustomizationPath', () => {
        it('returns banner path when present', async () => {
            const mockBannerPath = '/path/to/banner.png';
            vi.mocked(getBannerPathIfPresent).mockResolvedValue(mockBannerPath);

            await expect(service.getCustomizationPath('banner')).resolves.toBe(mockBannerPath);
        });

        it('returns case path when present', async () => {
            const mockCasePath = '/path/to/case.png';
            vi.mocked(getCasePathIfPresent).mockResolvedValue(mockCasePath);

            await expect(service.getCustomizationPath('case')).resolves.toBe(mockCasePath);
        });

        it('returns null when no path is available', async () => {
            vi.mocked(getBannerPathIfPresent).mockResolvedValue(null);
            vi.mocked(getCasePathIfPresent).mockResolvedValue(null);

            await expect(service.getCustomizationPath('banner')).resolves.toBeNull();
            await expect(service.getCustomizationPath('case')).resolves.toBeNull();
        });
    });

    describe('getCustomizationStream', () => {
        it('returns read stream for banner', async () => {
            const mockPath = '/path/to/banner.png';
            const mockStream: ReadStream = Readable.from([]) as ReadStream;

            vi.mocked(getBannerPathIfPresent).mockResolvedValue(mockPath);
            vi.mocked(createReadStream).mockReturnValue(mockStream);

            await expect(service.getCustomizationStream('banner')).resolves.toBe(mockStream);
            expect(createReadStream).toHaveBeenCalledWith(mockPath);
        });

        it('returns read stream for case', async () => {
            const mockPath = '/path/to/case.png';
            const mockStream: ReadStream = Readable.from([]) as ReadStream;

            vi.mocked(getCasePathIfPresent).mockResolvedValue(mockPath);
            vi.mocked(createReadStream).mockReturnValue(mockStream);

            await expect(service.getCustomizationStream('case')).resolves.toBe(mockStream);
            expect(createReadStream).toHaveBeenCalledWith(mockPath);
        });

        it('throws when no customization is available', async () => {
            vi.mocked(getBannerPathIfPresent).mockResolvedValue(null);
            vi.mocked(getCasePathIfPresent).mockResolvedValue(null);

            await expect(service.getCustomizationStream('banner')).rejects.toThrow('No banner found');
            await expect(service.getCustomizationStream('case')).rejects.toThrow('No case found');
        });
    });
});
