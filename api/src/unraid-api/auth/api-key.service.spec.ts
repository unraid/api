import { Logger } from '@nestjs/common';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { ensureDir, ensureDirSync } from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '@app/environment.js';
import { getters } from '@app/store/index.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ApiKey } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';

// Mock the store and its modules
vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: vi.fn(),
    },
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(),
    },
}));

// Mock fs/promises
vi.mock('fs/promises', async () => ({
    readdir: vi.fn().mockResolvedValue(['key1.json', 'key2.json', 'notakey.txt']),
    readFile: vi.fn(),
    writeFile: vi.fn(),
}));

vi.mock('fs-extra', () => ({
    ensureDir: vi.fn(),
    ensureDirSync: vi.fn(),
}));

describe('ApiKeyService', () => {
    let apiKeyService: ApiKeyService;
    let mockLogger: {
        log: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
        warn: ReturnType<typeof vi.fn>;
        debug: ReturnType<typeof vi.fn>;
        verbose: ReturnType<typeof vi.fn>;
    };
    const mockBasePath = '/mock/path/to/keys';

    const mockApiKey: ApiKey = {
        id: 'test-api-id',
        key: 'test-secret-key',
        name: 'Test API Key',
        description: 'Test API Key Description',
        roles: [Role.GUEST],
        permissions: [
            {
                resource: Resource.CONNECT,
                actions: [AuthAction.READ_ANY],
            },
        ],
        createdAt: new Date().toISOString(),
    };

    beforeEach(async () => {
        environment.IS_MAIN_PROCESS = true;
        vi.resetAllMocks();

        // Create mock logger methods
        mockLogger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn(),
        };

        // Mock the Logger constructor
        vi.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);
        vi.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
        vi.spyOn(Logger.prototype, 'warn').mockImplementation(mockLogger.warn);
        vi.spyOn(Logger.prototype, 'debug').mockImplementation(mockLogger.debug);
        vi.spyOn(Logger.prototype, 'verbose').mockImplementation(mockLogger.verbose);

        // Mock the paths getter
        vi.mocked(getters.paths).mockReturnValue({
            'auth-keys': mockBasePath,
        } as any);

        // Mock ensureDir
        vi.mocked(ensureDir).mockResolvedValue();

        apiKeyService = new ApiKeyService();

        vi.spyOn(apiKeyService as any, 'generateApiKey').mockReturnValue('test-api-key');
        vi.mock('uuid', () => ({
            v4: () => 'test-api-id',
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should ensure directory exists', async () => {
            new ApiKeyService();
            expect(ensureDirSync).toHaveBeenCalledWith(mockBasePath);
        });

        it('should return correct base path', async () => {
            vi.mocked(ensureDir).mockResolvedValue();
            const paths = apiKeyService.getPaths();

            expect(paths.basePath).toBe(mockBasePath);
        });
    });

    describe('create', () => {
        it('should create ApiKey with generated key', async () => {
            const saveSpy = vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            const { id, description, roles } = mockApiKey;
            const name = 'Test API Key';

            const result = await apiKeyService.create({ name, description: description ?? '', roles });

            expect(result).toMatchObject({
                id,
                name: name,
                description,
                roles,
                createdAt: expect.any(String),
            });
            expect(result.key).toBeDefined();
            expect(typeof result.key).toBe('string');
            expect(result.key.length).toBeGreaterThan(0);

            expect(saveSpy).toHaveBeenCalledWith(result);
        });

        it('should validate input parameters', async () => {
            const saveSpy = vi.spyOn(apiKeyService, 'saveApiKey');

            await expect(
                apiKeyService.create({ name: '', description: 'desc', roles: [Role.GUEST] })
            ).rejects.toThrow(
                'API key name must contain only letters, numbers, and spaces (Unicode letters are supported)'
            );

            await expect(
                apiKeyService.create({ name: 'name', description: 'desc', roles: [] })
            ).rejects.toThrow('At least one role or permission must be specified');

            await expect(
                apiKeyService.create({
                    name: 'name',
                    description: 'desc',
                    roles: ['invalid_role' as Role],
                })
            ).rejects.toThrow('Invalid role specified');

            expect(saveSpy).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all API keys', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([
                mockApiKey,
                { ...mockApiKey, id: 'second-id' },
            ]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findAll();
            expect(result).toHaveLength(2);

            const expectedApiKey1 = {
                ...mockApiKey,
                id: 'test-api-id',
                permissions: [
                    {
                        resource: Resource.CONNECT,
                        actions: [AuthAction.READ_ANY],
                    },
                ],
            };

            const expectedApiKey2 = {
                ...mockApiKey,
                id: 'second-id',
                permissions: [
                    {
                        resource: Resource.CONNECT,
                        actions: [AuthAction.READ_ANY],
                    },
                ],
            };

            expect(result[0]).toMatchObject({ ...expectedApiKey1, createdAt: expect.any(String) });
            expect(result[1]).toMatchObject({ ...expectedApiKey2, createdAt: expect.any(String) });
        });

        it('should handle file read errors gracefully', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockRejectedValue(new Error('Read error'));
            await expect(apiKeyService.onModuleInit()).rejects.toThrow('Read error');
        });
    });

    describe('findById', () => {
        it('should return API key by id when found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([mockApiKey]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findById(mockApiKey.id);

            expect(result).toMatchObject({ ...mockApiKey, createdAt: expect.any(String) });
        });

        it('should return null if API key not found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([
                { ...mockApiKey, id: 'different-id' },
            ]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findById('non-existent-id');

            expect(result).toBeNull();
        });
    });

    describe('findByIdWithSecret', () => {
        it('should return API key with secret when found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([mockApiKey]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findByIdWithSecret(mockApiKey.id);

            expect(result).toEqual(mockApiKey);
        });

        it('should return null when API key not found', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findByIdWithSecret('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw GraphQLError on invalid data structure', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockImplementation(async () => {
                throw new Error('Invalid API key structure');
            });

            await expect(apiKeyService.onModuleInit()).rejects.toThrow('Invalid API key structure');
        });

        it('should throw error on file read error', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockRejectedValue(new Error('Read failed'));
            await expect(apiKeyService.onModuleInit()).rejects.toThrow('Read failed');
        });
    });

    describe('findByKey', () => {
        it('should return API key by key value when multiple keys exist', async () => {
            const differentKey = { ...mockApiKey, key: 'different-key' };
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([differentKey, mockApiKey]);

            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findByKey(mockApiKey.key);

            expect(result).toEqual(mockApiKey);
        });

        it('should return null if key not found in any file', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([
                { ...mockApiKey, key: 'different-key-1' },
                { ...mockApiKey, key: 'different-key-2' },
            ]);
            await apiKeyService.onModuleInit();

            const result = await apiKeyService.findByKey('non-existent-key');

            expect(result).toBeNull();
        });

        it('Should throw error when API key is corrupted', async () => {
            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockRejectedValue(
                new Error('Authentication system error: Corrupted key file')
            );

            await expect(apiKeyService.onModuleInit()).rejects.toThrow(
                'Authentication system error: Corrupted key file'
            );
        });
    });

    describe('saveApiKey', () => {
        it('should save API key to file', async () => {
            vi.mocked(writeFile).mockResolvedValue(undefined);

            await apiKeyService.saveApiKey(mockApiKey);

            const writeFileCalls = vi.mocked(writeFile).mock.calls;

            expect(writeFileCalls.length).toBe(1);

            const [filePath, fileContent] = writeFileCalls[0] ?? [];
            const expectedPath = join(mockBasePath, `${mockApiKey.id}.json`);

            expect(filePath).toBe(expectedPath);

            if (typeof fileContent === 'string') {
                const savedApiKey = JSON.parse(fileContent);

                expect(savedApiKey).toEqual(mockApiKey);
            } else {
                throw new Error('File content should be a string');
            }
        });

        it('should throw GraphQLError on write error', async () => {
            vi.mocked(writeFile).mockRejectedValue(new Error('Write failed'));

            await expect(apiKeyService.saveApiKey(mockApiKey)).rejects.toThrow(
                'Failed to save API key: Write failed'
            );
        });

        it('should throw GraphQLError on invalid API key structure', async () => {
            const invalidApiKey = {
                ...mockApiKey,
                name: '', // Invalid: name cannot be empty
            } as ApiKey;

            await expect(apiKeyService.saveApiKey(invalidApiKey)).rejects.toThrow(
                'Failed to save API key: Invalid data structure'
            );
        });

        it('should throw GraphQLError when roles and permissions array is empty', async () => {
            const invalidApiKey = {
                ...mockApiKey,
                permissions: [],
                roles: [],
            } as ApiKey;

            await expect(apiKeyService.saveApiKey(invalidApiKey)).rejects.toThrow(
                'At least one of permissions or roles must be specified'
            );
        });
    });

    describe('update', () => {
        let updateMockApiKey: ApiKey;

        beforeEach(() => {
            // Create a fresh copy of the mock data for update tests
            updateMockApiKey = {
                id: 'test-api-id',
                key: 'test-api-key',
                name: 'Test API Key',
                description: 'Test API Key Description',
                roles: [Role.GUEST],
                permissions: [
                    {
                        resource: Resource.CONNECT,
                        actions: [AuthAction.READ_ANY],
                    },
                ],
                createdAt: new Date().toISOString(),
            };

            vi.spyOn(apiKeyService, 'loadAllFromDisk').mockResolvedValue([updateMockApiKey]);
            vi.spyOn(apiKeyService, 'saveApiKey').mockResolvedValue();
            apiKeyService.onModuleInit();
        });

        it('should update name and description', async () => {
            const updatedName = 'Updated API Key';
            const updatedDescription = 'Updated Description';

            const result = await apiKeyService.update({
                id: updateMockApiKey.id,
                name: updatedName,
                description: updatedDescription,
            });

            expect(result.name).toBe(updatedName);
            expect(result.description).toBe(updatedDescription);
            expect(result.roles).toEqual(updateMockApiKey.roles);
            expect(result.permissions).toEqual(updateMockApiKey.permissions);
            expect(apiKeyService.saveApiKey).toHaveBeenCalledWith(result);
        });

        it('should update roles', async () => {
            const updatedRoles = [Role.ADMIN];

            const result = await apiKeyService.update({
                id: updateMockApiKey.id,
                roles: updatedRoles,
            });

            expect(result.roles).toEqual(updatedRoles);
            expect(result.name).toBe(updateMockApiKey.name);
            expect(result.description).toBe(updateMockApiKey.description);
            expect(result.permissions).toEqual(updateMockApiKey.permissions);
            expect(apiKeyService.saveApiKey).toHaveBeenCalledWith(result);
        });

        it('should update permissions', async () => {
            const updatedPermissions = [
                {
                    resource: Resource.CONNECT,
                    actions: [AuthAction.READ_ANY, AuthAction.UPDATE_ANY],
                },
            ];

            const result = await apiKeyService.update({
                id: updateMockApiKey.id,
                permissions: updatedPermissions,
            });

            expect(result.permissions).toEqual(updatedPermissions);
            expect(result.name).toBe(updateMockApiKey.name);
            expect(result.description).toBe(updateMockApiKey.description);
            expect(result.roles).toEqual(updateMockApiKey.roles);
            expect(apiKeyService.saveApiKey).toHaveBeenCalledWith(result);
        });

        it('should throw error when API key not found', async () => {
            await expect(
                apiKeyService.update({
                    id: 'non-existent-id',
                    name: 'New Name',
                })
            ).rejects.toThrow('API key not found');
        });

        it('should throw error when invalid role is provided', async () => {
            await expect(
                apiKeyService.update({
                    id: updateMockApiKey.id,
                    roles: ['INVALID_ROLE' as Role],
                })
            ).rejects.toThrow('Invalid role specified');
        });

        it('should throw error when invalid name is provided', async () => {
            await expect(
                apiKeyService.update({
                    id: updateMockApiKey.id,
                    name: 'Invalid@Name',
                })
            ).rejects.toThrow(
                'API key name must contain only letters, numbers, and spaces (Unicode letters are supported)'
            );
        });
    });

    describe('loadAllFromDisk', () => {
        let loadMockApiKey: ApiKey;

        beforeEach(() => {
            // Create a fresh copy of the mock data for loadAllFromDisk tests
            loadMockApiKey = {
                id: 'test-api-id',
                key: 'test-api-key',
                name: 'Test API Key',
                description: 'Test API Key Description',
                roles: [Role.GUEST],
                permissions: [
                    {
                        resource: Resource.CONNECT,
                        actions: [AuthAction.READ_ANY],
                    },
                ],
                createdAt: new Date().toISOString(),
            };
        });

        it('should load and parse all JSON files', async () => {
            const mockFiles = ['key1.json', 'key2.json', 'notakey.txt'];
            const secondKey = { ...loadMockApiKey, id: 'second-id', key: 'second-key' };

            vi.mocked(readdir).mockResolvedValue(mockFiles as any);
            vi.mocked(readFile)
                .mockResolvedValueOnce(JSON.stringify(loadMockApiKey))
                .mockResolvedValueOnce(JSON.stringify(secondKey));

            const result = await apiKeyService.loadAllFromDisk();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(loadMockApiKey);
            expect(result[1]).toEqual(secondKey);
            expect(readFile).toHaveBeenCalledTimes(2);
        });

        it('should throw error when directory read fails', async () => {
            vi.mocked(readdir).mockRejectedValue(new Error('Directory read failed'));

            await expect(apiKeyService.loadAllFromDisk()).rejects.toThrow('Failed to list API keys');

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to read API key directory')
            );
        });

        it('should ignore invalid API Key files when loading from disk', async () => {
            vi.mocked(readdir).mockResolvedValue([
                'key1.json',
                'badkey.json',
                'key2.json',
                'notakey.txt',
            ] as any);
            vi.mocked(readFile)
                .mockResolvedValueOnce(JSON.stringify(loadMockApiKey))
                .mockResolvedValueOnce(JSON.stringify({ invalid: 'structure' }))
                .mockResolvedValueOnce(
                    JSON.stringify({ ...loadMockApiKey, id: 'unique-id', key: 'unique-key' })
                );

            const result = await apiKeyService.loadAllFromDisk();
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                ...mockApiKey,
                createdAt: expect.any(String),
                id: 'test-api-id',
                key: 'test-api-key',
            });
            expect(result[1]).toEqual({
                ...mockApiKey,
                createdAt: expect.any(String),
                id: 'unique-id',
                key: 'unique-key',
            });
        });

        it('should normalize permission actions to lowercase when loading from disk', async () => {
            const apiKeyWithMixedCaseActions = {
                ...loadMockApiKey,
                permissions: [
                    {
                        resource: Resource.DOCKER,
                        actions: ['READ:ANY', 'Update:Any', 'create:any', 'DELETE:ANY'], // Mixed case actions
                    },
                    {
                        resource: Resource.ARRAY,
                        actions: ['Read:Any'], // Mixed case
                    },
                ],
            };

            vi.mocked(readdir).mockResolvedValue(['key1.json'] as any);
            vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(apiKeyWithMixedCaseActions));

            const result = await apiKeyService.loadAllFromDisk();

            expect(result).toHaveLength(1);
            // All actions should be normalized to lowercase
            expect(result[0].permissions[0].actions).toEqual([
                'read:any',
                'update:any',
                'create:any',
                'delete:any',
            ]);
            expect(result[0].permissions[1].actions).toEqual(['read:any']);
        });

        it('should normalize roles to uppercase when loading from disk', async () => {
            const apiKeyWithMixedCaseRoles = {
                ...loadMockApiKey,
                roles: ['admin', 'Viewer', 'CONNECT'], // Mixed case roles
            };

            vi.mocked(readdir).mockResolvedValue(['key1.json'] as any);
            vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(apiKeyWithMixedCaseRoles));

            const result = await apiKeyService.loadAllFromDisk();

            expect(result).toHaveLength(1);
            // All roles should be normalized to uppercase
            expect(result[0].roles).toEqual(['ADMIN', 'VIEWER', 'CONNECT']);
        });
    });

    describe('loadApiKeyFile', () => {
        it('should load and parse a valid API key file', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApiKey));

            const result = await apiKeyService['loadApiKeyFile']('test.json');

            expect(result).toEqual(mockApiKey);
            expect(readFile).toHaveBeenCalledWith(join(mockBasePath, 'test.json'), 'utf8');
        });

        it('should return null when file read fails', async () => {
            vi.mocked(readFile).mockRejectedValue(new Error('File read failed'));

            const result = await apiKeyService['loadApiKeyFile']('test.json');

            expect(result).toBeNull();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Error reading API key file test.json')
            );
        });

        it('should throw error on corrupted JSON', async () => {
            vi.mocked(readFile).mockResolvedValue('invalid json');

            await expect(apiKeyService['loadApiKeyFile']('test.json')).rejects.toThrow(
                'Authentication system error: Corrupted key file'
            );
        });

        it('should throw error on invalid API key structure', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify({ invalid: 'structure' }));

            await expect(apiKeyService['loadApiKeyFile']('test.json')).rejects.toThrow(
                'Invalid API key structure'
            );

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error validating API key file test.json')
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('An instance of ApiKey has failed the validation')
            );
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('property key'));
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('property id'));
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('property name'));
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('property roles'));
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('property createdAt'));
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('property permissions')
            );
        });

        it('should normalize legacy action formats when loading API keys', async () => {
            const legacyApiKey = {
                ...mockApiKey,
                permissions: [
                    {
                        resource: Resource.DOCKER,
                        actions: ['create', 'READ', 'Update', 'DELETE'], // Mixed case legacy verbs
                    },
                    {
                        resource: Resource.VMS,
                        actions: ['READ_ANY', 'UPDATE_OWN'], // GraphQL enum style
                    },
                    {
                        resource: Resource.CONNECT,
                        actions: ['read:own', 'update:any'], // Casbin colon format
                    },
                ],
            };

            vi.mocked(readFile).mockResolvedValue(JSON.stringify(legacyApiKey));

            const result = await apiKeyService['loadApiKeyFile']('legacy.json');

            expect(result).not.toBeNull();
            expect(result?.permissions).toEqual([
                {
                    resource: Resource.DOCKER,
                    actions: [
                        AuthAction.CREATE_ANY,
                        AuthAction.READ_ANY,
                        AuthAction.UPDATE_ANY,
                        AuthAction.DELETE_ANY,
                    ],
                },
                {
                    resource: Resource.VMS,
                    actions: [AuthAction.READ_ANY, AuthAction.UPDATE_OWN],
                },
                {
                    resource: Resource.CONNECT,
                    actions: [AuthAction.READ_OWN, AuthAction.UPDATE_ANY],
                },
            ]);
        });
    });
});
