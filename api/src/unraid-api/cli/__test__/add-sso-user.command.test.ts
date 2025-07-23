import { Test } from '@nestjs/testing';

import { InquirerService } from 'nest-commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { AddSSOUserCommand } from '@app/unraid-api/cli/sso/add-sso-user.command.js';

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

describe('AddSSOUserCommand', () => {
    let command: AddSSOUserCommand;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AddSSOUserCommand,
                { provide: CliInternalClientService, useValue: mockInternalClient },
                { provide: LogService, useValue: mockLogger },
                { provide: RestartCommand, useValue: mockRestartCommand },
                { provide: InquirerService, useValue: mockInquirerService },
            ],
        }).compile();

        command = module.get<AddSSOUserCommand>(AddSSOUserCommand);

        // Clear mocks
        vi.clearAllMocks();
    });

    it('should add a new SSO user successfully', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValue({
                data: {
                    settings: {
                        api: {
                            ssoSubIds: ['existing-user-id'],
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
            disclaimer: 'y',
            username: 'new-user-id',
        });

        await command.run([]);

        expect(mockClient.query).toHaveBeenCalled();
        expect(mockClient.mutate).toHaveBeenCalledWith({
            mutation: expect.anything(),
            variables: {
                input: {
                    api: {
                        ssoSubIds: ['existing-user-id', 'new-user-id'],
                    },
                },
            },
        });
        expect(mockLogger.info).toHaveBeenCalledWith('User added new-user-id, restarting the API');
        expect(mockRestartCommand.run).toHaveBeenCalled();
    });

    it('should not add user if disclaimer is not accepted', async () => {
        const mockClient = {
            query: vi.fn(),
            mutate: vi.fn(),
        };

        mockInternalClient.getClient.mockResolvedValue(mockClient);
        mockInquirerService.prompt.mockResolvedValue({
            disclaimer: 'n',
            username: 'new-user-id',
        });

        await command.run([]);

        expect(mockClient.query).not.toHaveBeenCalled();
        expect(mockClient.mutate).not.toHaveBeenCalled();
        expect(mockRestartCommand.run).not.toHaveBeenCalled();
    });

    it('should not add user if user already exists', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValue({
                data: {
                    settings: {
                        api: {
                            ssoSubIds: ['existing-user-id'],
                        },
                    },
                },
            }),
            mutate: vi.fn(),
        };

        mockInternalClient.getClient.mockResolvedValue(mockClient);
        mockInquirerService.prompt.mockResolvedValue({
            disclaimer: 'y',
            username: 'existing-user-id',
        });

        await command.run([]);

        expect(mockClient.query).toHaveBeenCalled();
        expect(mockClient.mutate).not.toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith(
            'User existing-user-id already exists in SSO users'
        );
        expect(mockRestartCommand.run).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        mockInternalClient.getClient.mockRejectedValue(new Error('Connection failed'));
        mockInquirerService.prompt.mockResolvedValue({
            disclaimer: 'y',
            username: 'new-user-id',
        });

        await command.run([]);

        expect(mockLogger.error).toHaveBeenCalledWith('Error adding user:', expect.any(Error));
    });
});
