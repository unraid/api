import { Test, TestingModule } from '@nestjs/testing';

import { InquirerService } from 'nest-commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AddApiKeyQuestionSet } from '@app/unraid-api/cli/apikey/add-api-key.questions.js';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

describe('ApiKeyCommand', () => {
    let command: ApiKeyCommand;
    let apiKeyService: ApiKeyService;
    let logService: LogService;
    let inquirerService: InquirerService;
    let questionSet: AddApiKeyQuestionSet;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiKeyCommand,
                AddApiKeyQuestionSet,
                {
                    provide: ApiKeyService,
                    useValue: {
                        findByField: vi.fn(),
                        create: vi.fn(),
                        findAll: vi.fn(),
                        deleteApiKeys: vi.fn(),
                        convertRolesStringArrayToRoles: vi.fn((roles) => roles),
                        convertPermissionsStringArrayToPermissions: vi.fn((perms) => perms),
                        getAllValidPermissions: vi.fn(() => []),
                    },
                },
                {
                    provide: LogService,
                    useValue: {
                        log: vi.fn(),
                        error: vi.fn(),
                    },
                },
                {
                    provide: InquirerService,
                    useValue: {
                        prompt: vi.fn(),
                    },
                },
            ],
        }).compile();

        command = module.get<ApiKeyCommand>(ApiKeyCommand);
        apiKeyService = module.get<ApiKeyService>(ApiKeyService);
        logService = module.get<LogService>(LogService);
        inquirerService = module.get<InquirerService>(InquirerService);
        questionSet = module.get<AddApiKeyQuestionSet>(AddApiKeyQuestionSet);
    });

    describe('AddApiKeyQuestionSet', () => {
        describe('shouldAskOverwrite', () => {
            it('should return true when an API key with the given name exists', () => {
                vi.mocked(apiKeyService.findByField).mockReturnValue({
                    key: 'existing-key',
                    name: 'test-key',
                    description: 'Test key',
                    roles: [],
                    permissions: [],
                } as any);

                const result = questionSet.shouldAskOverwrite({ name: 'test-key' });

                expect(result).toBe(true);
                expect(apiKeyService.findByField).toHaveBeenCalledWith('name', 'test-key');
            });

            it('should return false when no API key with the given name exists', () => {
                vi.mocked(apiKeyService.findByField).mockReturnValue(null);

                const result = questionSet.shouldAskOverwrite({ name: 'non-existent-key' });

                expect(result).toBe(false);
                expect(apiKeyService.findByField).toHaveBeenCalledWith('name', 'non-existent-key');
            });
        });
    });

    describe('run', () => {
        it('should find and return existing key when not creating', async () => {
            const mockKey = { key: 'test-api-key-123', name: 'test-key' };
            vi.mocked(apiKeyService.findByField).mockReturnValue(mockKey as any);

            await command.run([], { name: 'test-key', create: false });

            expect(apiKeyService.findByField).toHaveBeenCalledWith('name', 'test-key');
            expect(logService.log).toHaveBeenCalledWith('test-api-key-123');
        });

        it('should create new key when key does not exist and create flag is set', async () => {
            vi.mocked(apiKeyService.findByField).mockReturnValue(null);
            vi.mocked(apiKeyService.create).mockResolvedValue({ key: 'new-api-key-456' } as any);

            await command.run([], {
                name: 'new-key',
                create: true,
                roles: ['ADMIN'] as any,
                description: 'Test description',
            });

            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: 'new-key',
                description: 'Test description',
                roles: ['ADMIN'],
                permissions: undefined,
                overwrite: false,
            });
            expect(logService.log).toHaveBeenCalledWith('new-api-key-456');
        });

        it('should error when key exists and overwrite is not set in non-interactive mode', async () => {
            const mockKey = { key: 'existing-key', name: 'test-key' };
            vi.mocked(apiKeyService.findByField)
                .mockReturnValueOnce(null) // First call in line 131
                .mockReturnValueOnce(mockKey as any); // Second call in non-interactive check
            const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit');
            });

            await expect(
                command.run([], {
                    name: 'test-key',
                    create: true,
                    roles: ['ADMIN'] as any,
                })
            ).rejects.toThrow();

            expect(logService.error).toHaveBeenCalledWith(
                "API key with name 'test-key' already exists. Use --overwrite to replace it."
            );
            expect(exitSpy).toHaveBeenCalledWith(1);
            exitSpy.mockRestore();
        });

        it('should create key with overwrite when key exists and overwrite is set', async () => {
            const mockKey = { key: 'existing-key', name: 'test-key' };
            vi.mocked(apiKeyService.findByField)
                .mockReturnValueOnce(null) // First call in line 131
                .mockReturnValueOnce(mockKey as any); // Second call in non-interactive check
            vi.mocked(apiKeyService.create).mockResolvedValue({ key: 'overwritten-key' } as any);

            await command.run([], {
                name: 'test-key',
                create: true,
                roles: ['ADMIN'] as any,
                overwrite: true,
            });

            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: 'test-key',
                description: 'CLI generated key: test-key',
                roles: ['ADMIN'],
                permissions: undefined,
                overwrite: true,
            });
            expect(logService.log).toHaveBeenCalledWith('overwritten-key');
        });

        it('should prompt for missing fields when creating without sufficient info', async () => {
            vi.mocked(apiKeyService.findByField).mockReturnValue(null);
            vi.mocked(inquirerService.prompt).mockResolvedValue({
                name: 'prompted-key',
                roles: ['USER'],
                permissions: [],
                description: 'Prompted description',
                overwrite: false,
            } as any);
            vi.mocked(apiKeyService.create).mockResolvedValue({ key: 'prompted-api-key' } as any);

            await command.run([], { name: '', create: true });

            expect(inquirerService.prompt).toHaveBeenCalledWith('add-api-key', {
                name: '',
                create: true,
            });
            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: 'prompted-key',
                description: 'Prompted description',
                roles: ['USER'],
                permissions: [],
                overwrite: false,
            });
        });
    });
});
