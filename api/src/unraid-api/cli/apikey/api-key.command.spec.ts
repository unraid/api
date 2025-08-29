import { Test, TestingModule } from '@nestjs/testing';

import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { InquirerService } from 'nest-commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ApiKeyCommand } from '@app/unraid-api/cli/apikey/api-key.command.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

describe('ApiKeyCommand', () => {
    let command: ApiKeyCommand;
    let apiKeyService: ApiKeyService;
    let logService: LogService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiKeyCommand,
                {
                    provide: ApiKeyService,
                    useValue: {
                        findByField: vi.fn(),
                        create: vi.fn(),
                        convertRolesStringArrayToRoles: vi.fn(),
                        convertPermissionsStringArrayToPermissions: vi.fn(),
                        findAll: vi.fn(),
                        deleteApiKeys: vi.fn(),
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
            ],
        }).compile();

        command = module.get<ApiKeyCommand>(ApiKeyCommand);
        apiKeyService = module.get<ApiKeyService>(ApiKeyService);
        logService = module.get<LogService>(LogService);
    });

    describe('parseRoles', () => {
        it('should parse valid roles correctly', () => {
            const mockConvert = vi
                .spyOn(apiKeyService, 'convertRolesStringArrayToRoles')
                .mockReturnValue([Role.ADMIN, Role.CONNECT]);

            const result = command.parseRoles('ADMIN,CONNECT');

            expect(mockConvert).toHaveBeenCalledWith(['ADMIN', 'CONNECT']);
            expect(result).toEqual([Role.ADMIN, Role.CONNECT]);
        });

        it('should return GUEST role when no roles provided', () => {
            const result = command.parseRoles('');

            expect(result).toEqual([Role.GUEST]);
        });

        it('should handle roles with spaces', () => {
            const mockConvert = vi
                .spyOn(apiKeyService, 'convertRolesStringArrayToRoles')
                .mockReturnValue([Role.ADMIN, Role.VIEWER]);

            const result = command.parseRoles('ADMIN, VIEWER');

            expect(mockConvert).toHaveBeenCalledWith(['ADMIN', ' VIEWER']);
            expect(result).toEqual([Role.ADMIN, Role.VIEWER]);
        });

        it('should throw error when no valid roles found', () => {
            vi.spyOn(apiKeyService, 'convertRolesStringArrayToRoles').mockReturnValue([]);

            expect(() => command.parseRoles('INVALID_ROLE')).toThrow(
                `Invalid roles. Valid options are: ${Object.values(Role).join(', ')}`
            );
        });

        it('should handle mixed valid and invalid roles with warning', () => {
            const mockConvert = vi
                .spyOn(apiKeyService, 'convertRolesStringArrayToRoles')
                .mockImplementation((roles) => {
                    const validRoles: Role[] = [];
                    const invalidRoles: string[] = [];

                    for (const roleStr of roles) {
                        const upperRole = roleStr.trim().toUpperCase();
                        const role = Role[upperRole as keyof typeof Role];

                        if (role) {
                            validRoles.push(role);
                        } else {
                            invalidRoles.push(roleStr);
                        }
                    }

                    if (invalidRoles.length > 0) {
                        logService.warn(`Ignoring invalid roles: ${invalidRoles.join(', ')}`);
                    }

                    return validRoles;
                });

            const result = command.parseRoles('ADMIN,INVALID,VIEWER');

            expect(mockConvert).toHaveBeenCalledWith(['ADMIN', 'INVALID', 'VIEWER']);
            expect(logService.warn).toHaveBeenCalledWith('Ignoring invalid roles: INVALID');
            expect(result).toEqual([Role.ADMIN, Role.VIEWER]);
        });
    });

    describe('run', () => {
        it('should create API key with roles without prompting', async () => {
            const mockKey = {
                id: 'test-id',
                key: 'test-key-123',
                name: 'TEST',
                roles: [Role.ADMIN],
                createdAt: new Date().toISOString(),
                permissions: [],
            };
            vi.spyOn(apiKeyService, 'findByField').mockReturnValue(null);
            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockKey);

            await command.run([], {
                name: 'TEST',
                create: true,
                roles: [Role.ADMIN],
                permissions: undefined,
                description: 'Test description',
            });

            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: 'TEST',
                description: 'Test description',
                roles: [Role.ADMIN],
                permissions: undefined,
                overwrite: true,
            });
            expect(logService.log).toHaveBeenCalledWith('test-key-123');
        });

        it('should create API key with permissions only without prompting', async () => {
            const mockKey = {
                id: 'test-id',
                key: 'test-key-456',
                name: 'TEST_PERMS',
                roles: [],
                createdAt: new Date().toISOString(),
                permissions: [],
            };
            const mockPermissions = [
                {
                    resource: Resource.DOCKER,
                    actions: [AuthAction.READ_ANY],
                },
            ];

            vi.spyOn(apiKeyService, 'findByField').mockReturnValue(null);
            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockKey);

            await command.run([], {
                name: 'TEST_PERMS',
                create: true,
                roles: undefined,
                permissions: mockPermissions,
                description: 'Test with permissions',
            });

            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: 'TEST_PERMS',
                description: 'Test with permissions',
                roles: undefined,
                permissions: mockPermissions,
                overwrite: true,
            });
            expect(logService.log).toHaveBeenCalledWith('test-key-456');
        });

        it('should use default description when not provided', async () => {
            const mockKey = {
                id: 'test-id',
                key: 'test-key-789',
                name: 'NO_DESC',
                roles: [Role.VIEWER],
                createdAt: new Date().toISOString(),
                permissions: [],
            };
            vi.spyOn(apiKeyService, 'findByField').mockReturnValue(null);
            vi.spyOn(apiKeyService, 'create').mockResolvedValue(mockKey);

            await command.run([], {
                name: 'NO_DESC',
                create: true,
                roles: [Role.VIEWER],
                permissions: undefined,
            });

            expect(apiKeyService.create).toHaveBeenCalledWith({
                name: 'NO_DESC',
                description: 'CLI generated key: NO_DESC',
                roles: [Role.VIEWER],
                permissions: undefined,
                overwrite: true,
            });
        });

        it('should return existing key when found', async () => {
            const existingKey = {
                id: 'existing-id',
                key: 'existing-key-123',
                name: 'EXISTING',
                roles: [Role.ADMIN],
                createdAt: new Date().toISOString(),
                permissions: [],
            };
            vi.spyOn(apiKeyService, 'findByField').mockReturnValue(existingKey);

            await command.run([], {
                name: 'EXISTING',
                create: false,
            });

            expect(apiKeyService.findByField).toHaveBeenCalledWith('name', 'EXISTING');
            expect(logService.log).toHaveBeenCalledWith('existing-key-123');
            expect(apiKeyService.create).not.toHaveBeenCalled();
        });

        it('should handle uppercase role conversion', () => {
            const mockConvert = vi
                .spyOn(apiKeyService, 'convertRolesStringArrayToRoles')
                .mockImplementation((roles) => {
                    return roles
                        .map((roleStr) => Role[roleStr.trim().toUpperCase() as keyof typeof Role])
                        .filter(Boolean);
                });

            const result = command.parseRoles('admin,connect');

            expect(mockConvert).toHaveBeenCalledWith(['admin', 'connect']);
            expect(result).toEqual([Role.ADMIN, Role.CONNECT]);
        });

        it('should handle lowercase role conversion', () => {
            const mockConvert = vi
                .spyOn(apiKeyService, 'convertRolesStringArrayToRoles')
                .mockImplementation((roles) => {
                    return roles
                        .map((roleStr) => Role[roleStr.trim().toUpperCase() as keyof typeof Role])
                        .filter(Boolean);
                });

            const result = command.parseRoles('viewer');

            expect(mockConvert).toHaveBeenCalledWith(['viewer']);
            expect(result).toEqual([Role.VIEWER]);
        });

        it('should handle mixed case role conversion', () => {
            const mockConvert = vi
                .spyOn(apiKeyService, 'convertRolesStringArrayToRoles')
                .mockImplementation((roles) => {
                    return roles
                        .map((roleStr) => Role[roleStr.trim().toUpperCase() as keyof typeof Role])
                        .filter(Boolean);
                });

            const result = command.parseRoles('Admin,CoNnEcT');

            expect(mockConvert).toHaveBeenCalledWith(['Admin', 'CoNnEcT']);
            expect(result).toEqual([Role.ADMIN, Role.CONNECT]);
        });
    });
});
