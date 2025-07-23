import { Test } from '@nestjs/testing';

import { InquirerService } from 'nest-commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { RemoveSSOUserCommand } from '@app/unraid-api/cli/sso/remove-sso-user.command.js';

// Mock services
const mockInternalClient = {
    getClient: vi.fn(),
};

const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
};

const mockRestartCommand = {
    run: vi.fn(),
};

const mockInquirerService = {
    prompt: vi.fn(),
};

describe('RemoveSSOUserCommand', () => {
    let command: RemoveSSOUserCommand;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                RemoveSSOUserCommand,
                { provide: CliInternalClientService, useValue: mockInternalClient },
                { provide: LogService, useValue: mockLogger },
                { provide: RestartCommand, useValue: mockRestartCommand },
                { provide: InquirerService, useValue: mockInquirerService },
            ],
        }).compile();

        command = module.get<RemoveSSOUserCommand>(RemoveSSOUserCommand);

        // Clear mocks
        vi.clearAllMocks();
    });

    it('should remove a specific SSO user successfully', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValue({
                data: {
                    settings: {
                        api: {
                            ssoSubIds: ['user-1', 'user-2', 'user-3'],
                        },
                    },
                },
            }),
            mutate: vi.fn().mockResolvedValue({
                data: {
                    updateSettings: {
                        restartRequired: true,
                        values: {},
                    },
                },
            }),
        };

        mockInternalClient.getClient.mockResolvedValue(mockClient);
        mockInquirerService.prompt.mockResolvedValue({
            username: 'user-2',
        });

        await command.run([]);

        expect(mockClient.query).toHaveBeenCalled();
        expect(mockClient.mutate).toHaveBeenCalledWith({
            mutation: expect.anything(),
            variables: {
                input: {
                    api: {
                        ssoSubIds: ['user-1', 'user-3'],
                    },
                },
            },
        });
        expect(mockLogger.info).toHaveBeenCalledWith('User removed: user-2');
        expect(mockLogger.info).toHaveBeenCalledWith('Restarting the API');
        expect(mockRestartCommand.run).toHaveBeenCalled();
    });

    it('should remove all SSO users when "all" is selected', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValue({
                data: {
                    settings: {
                        api: {
                            ssoSubIds: ['user-1', 'user-2', 'user-3'],
                        },
                    },
                },
            }),
            mutate: vi.fn().mockResolvedValue({
                data: {
                    updateSettings: {
                        restartRequired: true,
                        values: {},
                    },
                },
            }),
        };

        mockInternalClient.getClient.mockResolvedValue(mockClient);
        mockInquirerService.prompt.mockResolvedValue({
            username: 'all',
        });

        await command.run([]);

        expect(mockClient.query).toHaveBeenCalled();
        expect(mockClient.mutate).toHaveBeenCalledWith({
            mutation: expect.anything(),
            variables: {
                input: {
                    api: {
                        ssoSubIds: [],
                    },
                },
            },
        });
        expect(mockLogger.info).toHaveBeenCalledWith('All users removed from SSO');
        expect(mockRestartCommand.run).toHaveBeenCalled();
    });

    it('should not remove user if user does not exist', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValue({
                data: {
                    settings: {
                        api: {
                            ssoSubIds: ['user-1', 'user-3'],
                        },
                    },
                },
            }),
            mutate: vi.fn(),
        };

        mockInternalClient.getClient.mockResolvedValue(mockClient);
        mockInquirerService.prompt.mockResolvedValue({
            username: 'user-2',
        });

        await command.run([]);

        expect(mockClient.query).toHaveBeenCalled();
        expect(mockClient.mutate).not.toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith('User user-2 not found in SSO users');
        expect(mockRestartCommand.run).not.toHaveBeenCalled();
    });

    it('should exit when no SSO users are found', async () => {
        const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit');
        });

        const error = new Error('No SSO Users Found');
        (error as any).name = 'NoSSOUsersFoundError';
        mockInquirerService.prompt.mockRejectedValue(error);

        try {
            await command.run([]);
        } catch (error) {
            // Expected to throw due to process.exit
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to fetch SSO users: %s',
            'No SSO Users Found'
        );
        expect(processExitSpy).toHaveBeenCalledWith(1);

        processExitSpy.mockRestore();
    });
});
