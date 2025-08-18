import { Test, TestingModule } from '@nestjs/testing';

import { Resource, Role } from '@unraid/shared/graphql.model.js';
import { InquirerService } from 'nest-commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AddApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/add-api-key.questions.js';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command.js';
import { DeleteApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/delete-api-key.questions.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { ApiKeyWithSecret } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';

describe('ApiKeyCommand', () => {
    let command: ApiKeyCommand;
    let apiKeyService: ApiKeyService;
    let logService: LogService;
    let inquirerService: InquirerService;
    let module: TestingModule;

    const mockApiKeys: ApiKeyWithSecret[] = [
        {
            id: '1',
            name: 'TestKey1',
            description: 'Test API Key 1',
            key: 'test-key-1-secret',
            roles: [Role.ADMIN],
            permissions: [],
            createdAt: new Date().toISOString(),
        },
        {
            id: '2',
            name: 'TestKey2',
            description: 'Test API Key 2',
            key: 'test-key-2-secret',
            roles: [Role.GUEST],
            permissions: [{ resource: Resource.ME, actions: ['read', 'write'] }],
            createdAt: new Date().toISOString(),
        },
    ];

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                ApiKeyCommand,
                {
                    provide: ApiKeyService,
                    useValue: {
                        findAll: vi.fn(),
                        findByField: vi.fn(),
                        create: vi.fn(),
                        deleteApiKeys: vi.fn(),
                        convertPermissionsStringArrayToPermissions: vi.fn(),
                    },
                },
                {
                    provide: LogService,
                    useValue: {
                        log: vi.fn(),
                        error: vi.fn(),
                        warn: vi.fn(),
                    },
                },
                {
                    provide: InquirerService,
                    useValue: {
                        prompt: vi.fn(),
                    },
                },
                {
                    provide: AddApiKeyQuestionSet,
                    useValue: {},
                },
                {
                    provide: DeleteApiKeyQuestionSet,
                    useValue: {},
                },
            ],
        }).compile();

        command = module.get<ApiKeyCommand>(ApiKeyCommand);
        apiKeyService = module.get<ApiKeyService>(ApiKeyService);
        logService = module.get<LogService>(LogService);
        inquirerService = module.get<InquirerService>(InquirerService);
    });

    afterEach(async () => {
        await module?.close();
        vi.clearAllMocks();
    });

    describe('--list option', () => {
        it('should list all API keys with their details', async () => {
            vi.mocked(apiKeyService.findAll).mockResolvedValue(mockApiKeys);
            vi.mocked(apiKeyService.findByField).mockImplementation((field, value) => {
                if (field === 'id') {
                    return mockApiKeys.find((key) => key.id === value) || null;
                }
                return null;
            });

            await command.run([], { name: '', create: false, list: true });

            expect(apiKeyService.findAll).toHaveBeenCalledOnce();
            expect(logService.log).toHaveBeenCalledWith('Found 2 API keys:\n');
            expect(logService.log).toHaveBeenCalledWith('Name: TestKey1');
            expect(logService.log).toHaveBeenCalledWith('  Description: Test API Key 1');
            expect(logService.log).toHaveBeenCalledWith('  Roles: ADMIN');
            expect(logService.log).toHaveBeenCalledWith('  Key: test-key-1-secret');
            expect(logService.log).toHaveBeenCalledWith('Name: TestKey2');
            expect(logService.log).toHaveBeenCalledWith('  Description: Test API Key 2');
            expect(logService.log).toHaveBeenCalledWith('  Roles: GUEST');
            expect(logService.log).toHaveBeenCalledWith('  Permissions: ME:read, ME:write');
            expect(logService.log).toHaveBeenCalledWith('  Key: test-key-2-secret');
        });

        it('should handle when no API keys are found', async () => {
            vi.mocked(apiKeyService.findAll).mockResolvedValue([]);

            await command.run([], { name: '', create: false, list: true });

            expect(apiKeyService.findAll).toHaveBeenCalledOnce();
            expect(logService.log).toHaveBeenCalledWith('No API keys found');
        });

        it('should handle single API key correctly', async () => {
            const singleKey = [mockApiKeys[0]];
            vi.mocked(apiKeyService.findAll).mockResolvedValue(singleKey);
            vi.mocked(apiKeyService.findByField).mockReturnValue(singleKey[0]);

            await command.run([], { name: '', create: false, list: true });

            expect(logService.log).toHaveBeenCalledWith('Found 1 API key:\n');
        });
    });

    describe('--delete option', () => {
        it('should delete selected API keys', async () => {
            vi.mocked(apiKeyService.findAll).mockResolvedValue(mockApiKeys);
            vi.mocked(inquirerService.prompt).mockResolvedValue({
                selectedKeys: ['1', '2'],
            });
            vi.mocked(apiKeyService.deleteApiKeys).mockResolvedValue(undefined);

            await command.run([], { name: '', create: false, delete: true });

            expect(apiKeyService.findAll).toHaveBeenCalledOnce();
            expect(inquirerService.prompt).toHaveBeenCalledOnce();
            expect(apiKeyService.deleteApiKeys).toHaveBeenCalledWith(['1', '2']);
            expect(logService.log).toHaveBeenCalledWith('Successfully deleted 2 API keys');
        });

        it('should handle when no keys are selected for deletion', async () => {
            vi.mocked(apiKeyService.findAll).mockResolvedValue(mockApiKeys);
            vi.mocked(inquirerService.prompt).mockResolvedValue({
                selectedKeys: [],
            });

            await command.run([], { name: '', create: false, delete: true });

            expect(apiKeyService.deleteApiKeys).not.toHaveBeenCalled();
            expect(logService.log).toHaveBeenCalledWith('No keys selected for deletion');
        });

        it('should handle when no API keys exist to delete', async () => {
            vi.mocked(apiKeyService.findAll).mockResolvedValue([]);

            await command.run([], { name: '', create: false, delete: true });

            expect(inquirerService.prompt).not.toHaveBeenCalled();
            expect(logService.log).toHaveBeenCalledWith('No API keys found to delete');
        });

        it('should handle deletion errors', async () => {
            const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit');
            });

            vi.mocked(apiKeyService.findAll).mockResolvedValue(mockApiKeys);
            vi.mocked(inquirerService.prompt).mockResolvedValue({
                selectedKeys: ['1'],
            });
            vi.mocked(apiKeyService.deleteApiKeys).mockRejectedValue(new Error('Delete failed'));

            await expect(command.run([], { name: '', create: false, delete: true })).rejects.toThrow();

            expect(logService.error).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(1);

            processExitSpy.mockRestore();
        });
    });

    describe('--create option', () => {
        it('should create a new API key with roles', async () => {
            const newKey = {
                id: '3',
                name: 'NewKey',
                description: 'New API Key',
                key: 'new-key-secret',
                roles: [Role.ADMIN],
                permissions: [],
                createdAt: new Date().toISOString(),
            };

            vi.mocked(apiKeyService.findByField).mockReturnValue(null);
            vi.mocked(inquirerService.prompt).mockResolvedValue({
                name: 'NewKey',
                description: 'New API Key',
                roles: [Role.ADMIN],
                permissions: [],
            });
            vi.mocked(apiKeyService.create).mockResolvedValue(newKey);

            await command.run([], { name: 'NewKey', create: true });

            expect(apiKeyService.findByField).toHaveBeenCalledWith('name', 'NewKey');
            expect(inquirerService.prompt).toHaveBeenCalled();
            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: 'NewKey',
                description: 'New API Key',
                roles: [Role.ADMIN],
                permissions: [],
                overwrite: true,
            });
            expect(logService.log).toHaveBeenCalledWith('new-key-secret');
        });

        it('should return existing key if found and not overwriting', async () => {
            vi.mocked(apiKeyService.findByField).mockReturnValue(mockApiKeys[0]);

            await command.run([], { name: 'TestKey1', create: true });

            expect(apiKeyService.create).not.toHaveBeenCalled();
            expect(logService.log).toHaveBeenCalledWith('test-key-1-secret');
        });

        it('should error if no roles or permissions provided', async () => {
            vi.mocked(apiKeyService.findByField).mockReturnValue(null);
            vi.mocked(inquirerService.prompt).mockResolvedValue({
                name: 'NewKey',
                description: 'New API Key',
                roles: [],
                permissions: [],
            });

            await command.run([], { name: 'NewKey', create: true });

            expect(apiKeyService.create).not.toHaveBeenCalled();
            expect(logService.error).toHaveBeenCalledWith(
                'Please add at least one role or permission to the key.'
            );
        });
    });

    describe('fetch by name', () => {
        it('should fetch and display key by name', async () => {
            vi.mocked(apiKeyService.findByField).mockReturnValue(mockApiKeys[0]);

            await command.run([], { name: 'TestKey1', create: false });

            expect(apiKeyService.findByField).toHaveBeenCalledWith('name', 'TestKey1');
            expect(logService.log).toHaveBeenCalledWith('test-key-1-secret');
        });

        it('should log error when key not found', async () => {
            const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit');
            });

            vi.mocked(apiKeyService.findByField).mockReturnValue(null);

            await expect(command.run([], { name: 'NonExistent', create: false })).rejects.toThrow();

            expect(logService.log).toHaveBeenCalledWith('No Key Found');
            expect(processExitSpy).toHaveBeenCalledWith(1);

            processExitSpy.mockRestore();
        });
    });

    describe('option parsing', () => {
        it('should parse roles correctly', () => {
            const roles = command.parseRoles('admin,guest,connect');
            expect(roles).toEqual([Role.ADMIN, Role.GUEST, Role.CONNECT]);
        });

        it('should filter invalid roles and warn', () => {
            const roles = command.parseRoles('admin,invalid,guest');
            expect(roles).toEqual([Role.ADMIN, Role.GUEST]);
            expect(logService.warn).toHaveBeenCalledWith('Ignoring invalid roles: INVALID');
        });

        it('should throw error if no valid roles provided', () => {
            expect(() => command.parseRoles('invalid1,invalid2')).toThrow('Invalid roles');
        });

        it('should parse permissions correctly', () => {
            const permissionString = 'ME:read,ME:write';
            vi.mocked(apiKeyService.convertPermissionsStringArrayToPermissions).mockReturnValue([
                { resource: Resource.ME, actions: ['read', 'write'] },
            ]);

            const permissions = command.parsePermissions(permissionString);

            expect(apiKeyService.convertPermissionsStringArrayToPermissions).toHaveBeenCalledWith([
                'ME:read',
                'ME:write',
            ]);
            expect(permissions).toEqual([{ resource: Resource.ME, actions: ['read', 'write'] }]);
        });

        it('should parse boolean options correctly', () => {
            expect(command.parseCreate()).toBe(true);
            expect(command.parseDelete()).toBe(true);
            expect(command.parseList()).toBe(true);
        });

        it('should parse name and description correctly', () => {
            expect(command.parseName('TestKey')).toBe('TestKey');
            expect(command.parseDescription('Test Description')).toBe('Test Description');
        });
    });
});
