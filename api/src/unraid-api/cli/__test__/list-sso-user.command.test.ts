import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { ListSSOUserCommand } from '@app/unraid-api/cli/sso/list-sso-user.command.js';

// Mock services
const mockInternalClient = {
    getClient: vi.fn(),
};

const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
};

describe('ListSSOUserCommand', () => {
    let command: ListSSOUserCommand;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ListSSOUserCommand,
                { provide: CliInternalClientService, useValue: mockInternalClient },
                { provide: LogService, useValue: mockLogger },
            ],
        }).compile();

        command = module.get<ListSSOUserCommand>(ListSSOUserCommand);

        // Clear mocks
        vi.clearAllMocks();
    });

    it('should list all SSO users', async () => {
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
        };

        mockInternalClient.getClient.mockResolvedValue(mockClient);

        await command.run([]);

        expect(mockClient.query).toHaveBeenCalledWith({
            query: expect.anything(),
        });
        expect(mockLogger.info).toHaveBeenCalledWith('user-1\nuser-2\nuser-3');
    });

    it('should display message when no users found', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValue({
                data: {
                    settings: {
                        api: {
                            ssoSubIds: [],
                        },
                    },
                },
            }),
        };

        mockInternalClient.getClient.mockResolvedValue(mockClient);

        await command.run([]);

        expect(mockClient.query).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('No SSO users found');
    });

    it('should handle errors gracefully', async () => {
        mockInternalClient.getClient.mockRejectedValue(new Error('Connection failed'));

        await expect(command.run([])).rejects.toThrow('Connection failed');
    });
});
