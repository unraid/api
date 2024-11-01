import { type ApiKey } from '@app/graphql/generated/api/types';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import * as fs from 'fs';

import { ApiKeyService } from './api-key.service';
import { getters } from '@app/store';

vi.mock('fs');
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
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);

        apiKeyService = new ApiKeyService();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('paths', () => {
        it('should create directory if it does not exist', () => {
            vi.mocked(fs.existsSync).mockReturnValueOnce(false);

            apiKeyService.paths();

            expect(fs.mkdirSync).toHaveBeenCalledWith(mockBasePath, { recursive: true });
        });

        it('should return correct paths', () => {
            const paths = apiKeyService.paths();
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
            vi.mocked(fs.promises.readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(mockApiKey);
            expect(result[1]).toEqual(mockApiKey);
        });
    });

    describe('findById', () => {
        it('should return API key by id', async () => {
            vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findById(mockApiKey.id);

            expect(result).toEqual(mockApiKey);
        });

        it('should return null if API key not found', async () => {
            vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));

            const result = await apiKeyService.findById('non-existent-id');

            expect(result).toBeNull();
        });

        it('should return null if file content is invalid JSON', async () => {
            vi.mocked(fs.promises.readFile).mockResolvedValue('invalid json');

            const result = await apiKeyService.findById(mockApiKey.id);

            expect(result).toBeNull();
        });
    });

    describe('findByKey', () => {
        it('should return API key by key value when multiple keys exist', async () => {
            vi.mocked(fs.promises.readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(fs.promises.readFile)
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKey, key: 'different-key' }))
                .mockResolvedValueOnce(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findByKey(mockApiKey.key);

            expect(result).toEqual(mockApiKey);
            expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
        });

        it('should return null if key not found in any file', async () => {
            vi.mocked(fs.promises.readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(fs.promises.readFile)
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKey, key: 'different-key-1' }))
                .mockResolvedValueOnce(JSON.stringify({ ...mockApiKey, key: 'different-key-2' }));

            const result = await apiKeyService.findByKey('non-existent-key');

            expect(result).toBeNull();
            expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
        });

        it('should handle file read errors gracefully', async () => {
            vi.mocked(fs.promises.readdir).mockResolvedValue(['key1.json', 'key2.json'] as any);
            vi.mocked(fs.promises.readFile)
                .mockRejectedValueOnce(new Error('Read error'))
                .mockResolvedValueOnce(JSON.stringify(mockApiKey));

            const result = await apiKeyService.findByKey(mockApiKey.key);

            expect(result).toEqual(mockApiKey);
            expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
        });
    });

    describe('saveApiKey', () => {
        it('should save API key to file', async () => {
            vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined);

            await apiKeyService.saveApiKey(mockApiKey);

            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                join(mockBasePath, `${mockApiKey.id}.json`),
                JSON.stringify(mockApiKey, null, 2)
            );
        });

        it('should throw InternalServerErrorException on write error', async () => {
            vi.mocked(fs.promises.writeFile).mockRejectedValue(new Error('Write failed'));

            await expect(apiKeyService.saveApiKey(mockApiKey)).rejects.toThrow(
                'Failed to save API key: Write failed'
            );
        });
    });
});
