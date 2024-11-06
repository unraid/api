import { type ApiKey } from '@app/graphql/generated/api/types';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';

import { ApiKeyService } from './api-key.service';
import { getters } from '@app/store';

vi.mock('fs/promises', async () => ({
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
}));
vi.mock('@app/store');

describe('ApiKeyService', () => {
    let apiKeyService: ApiKeyService;
    const mockBasePath = '/mock/path/to/keys';

    const mockApiKey: ApiKey = {
        __typename: 'ApiKey',
        id: '10f356da-1e9e-43b8-9028-a26a645539a6',
        key: '73717ca0-8c15-40b9-bcca-8d85656d1438',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: ['guest'],
        createdAt: new Date().toISOString(),
        expiresAt: 0,
        scopes: {},
        lastUsed: null,
    };

    beforeEach(() => {
        vi.resetAllMocks();

        // Mock the paths getter
        vi.mocked(getters.paths).mockReturnValue({
            'auth-keys': mockBasePath,
        } as any);

        // Mock the fs methods
        vi.mocked(access).mockResolvedValue(undefined);
        vi.mocked(mkdir).mockResolvedValue(undefined);

        apiKeyService = new ApiKeyService();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('paths', () => {
        it('should create directory if it does not exist', async () => {
            vi.mocked(access).mockRejectedValueOnce(new Error());
            vi.mocked(mkdir).mockResolvedValue(undefined);

            await apiKeyService.paths();

            expect(mkdir).toHaveBeenCalledWith(mockBasePath, { recursive: true });
        });

        it('should return correct paths', async () => {
            vi.mocked(access).mockResolvedValueOnce(undefined);

            const paths = await apiKeyService.paths();
            const testId = 'test-id';

            expect(paths.basePath).toBe(mockBasePath);
            expect(paths.keyFile(testId)).toBe(join(mockBasePath, `${testId}.json`));
        });
    });

    describe('create', () => {
        it('should create and save a new API key', async () => {
            const saveSpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const result = await apiKeyService.create('Test Key', 'Test Description', ['guest']);

            expect(result).toMatchObject({
                name: 'Test Key',
                description: 'Test Description',
                roles: ['guest'],
            });
            expect(saveSpy).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all API keys', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(mockApiKey);
            expect(result[1]).toEqual(mockApiKey);
        });

        it('should handle file read errors gracefully', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile).mockRejectedValue(new Error('Read error'));

            const result = await apiKeyService.findAll();

            expect(result).toHaveLength(0);
        });
    });

    describe('findById', () => {
        it('should return API key by id', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findById(mockApiKey.id);

            expect(result).toEqual(mockApiKey);
        });

        it('should return null if API key not found (ENOENT error)', async () => {
            const error = new Error('ENOENT');
            vi.mocked(readFile).mockRejectedValue(error);

            const result = await apiKeyService.findById('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw GraphQLError if JSON parsing fails', async () => {
            vi.mocked(readFile).mockResolvedValue('invalid json');

            await expect(apiKeyService.findById(mockApiKey.id)).rejects.toThrow(
                'Failed to read API key'
            );
        });
    });

    describe('findByKey', () => {
        it('should return API key by key value when multiple keys exist', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile)
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKey, key: 'different-key' }))
                .mockResolvedValueOnce(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findByKey(mockApiKey.key);

            expect(result).toEqual(mockApiKey);
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should return null if key not found in any file', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile)
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKey, key: 'different-key-1' }))
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKey, key: 'different-key-2' }));

            const result = await apiKeyService.findByKey('non-existent-key');

            expect(result).toBeNull();
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should handle file read errors gracefully', async () => {
            vi.mocked(readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(readFile)
                .mockRejectedValueOnce(new Error('Read error'))
                .mockResolvedValueOnce(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findByKey(mockApiKey.key);

            expect(result).toEqual(mockApiKey);
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should return null if directory read fails', async () => {
            vi.mocked(readdir).mockRejectedValue(new Error('Directory read error'));

            const result = await apiKeyService.findByKey(mockApiKey.key);

            expect(result).toBeNull();
        });
    });

    describe('saveApiKey', () => {
        it('should save API key to file', async () => {
            vi.mocked(writeFile).mockResolvedValue(undefined);

            await apiKeyService.saveApiKey(mockApiKey);

            expect(writeFile).toHaveBeenCalledWith(
                join(mockBasePath, `${mockApiKey.id}.json`),
                JSON.stringify(mockApiKey, null, 2)
            );
        });

        it('should throw GraphQLError on write error', async () => {
            vi.mocked(writeFile).mockRejectedValue(new Error('Write failed'));

            await expect(apiKeyService.saveApiKey(mockApiKey)).rejects.toThrow(
                'Failed to save API key: Write failed'
            );
        });
    });
});
