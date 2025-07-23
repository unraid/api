import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    InstallPluginCommand,
    ListPluginCommand,
    RemovePluginCommand,
} from '@app/unraid-api/cli/plugins/plugin.command.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';

// Mock services
const mockInternalClient = {
    getClient: vi.fn(),
};

const mockLogger = {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
};

const mockRestartCommand = {
    run: vi.fn(),
};

describe('Plugin Commands', () => {
    beforeEach(() => {
        // Clear mocks before each test
        vi.clearAllMocks();
    });

    describe('InstallPluginCommand', () => {
        let command: InstallPluginCommand;

        beforeEach(async () => {
            const module = await Test.createTestingModule({
                providers: [
                    InstallPluginCommand,
                    { provide: CliInternalClientService, useValue: mockInternalClient },
                    { provide: LogService, useValue: mockLogger },
                    { provide: RestartCommand, useValue: mockRestartCommand },
                ],
            }).compile();

            command = module.get<InstallPluginCommand>(InstallPluginCommand);
        });

        it('should install a plugin successfully', async () => {
            const mockClient = {
                mutate: vi.fn().mockResolvedValue({
                    data: {
                        addPlugin: false, // No manual restart required
                    },
                }),
            };

            mockInternalClient.getClient.mockResolvedValue(mockClient);

            await command.run(['@unraid/plugin-example'], { bundled: false, restart: true });

            expect(mockClient.mutate).toHaveBeenCalledWith({
                mutation: expect.anything(),
                variables: {
                    input: {
                        names: ['@unraid/plugin-example'],
                        bundled: false,
                        restart: true,
                    },
                },
            });
            expect(mockLogger.log).toHaveBeenCalledWith('Added plugin @unraid/plugin-example');
            expect(mockRestartCommand.run).not.toHaveBeenCalled(); // Because addPlugin returned false
        });

        it('should handle bundled plugin installation', async () => {
            const mockClient = {
                mutate: vi.fn().mockResolvedValue({
                    data: {
                        addPlugin: true, // Manual restart required
                    },
                }),
            };

            mockInternalClient.getClient.mockResolvedValue(mockClient);

            await command.run(['@unraid/bundled-plugin'], { bundled: true, restart: true });

            expect(mockClient.mutate).toHaveBeenCalledWith({
                mutation: expect.anything(),
                variables: {
                    input: {
                        names: ['@unraid/bundled-plugin'],
                        bundled: true,
                        restart: true,
                    },
                },
            });
            expect(mockLogger.log).toHaveBeenCalledWith('Added bundled plugin @unraid/bundled-plugin');
            expect(mockRestartCommand.run).toHaveBeenCalled(); // Because addPlugin returned true
        });

        it('should not restart when restart option is false', async () => {
            const mockClient = {
                mutate: vi.fn().mockResolvedValue({
                    data: {
                        addPlugin: true,
                    },
                }),
            };

            mockInternalClient.getClient.mockResolvedValue(mockClient);

            await command.run(['@unraid/plugin'], { bundled: false, restart: false });

            expect(mockRestartCommand.run).not.toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockInternalClient.getClient.mockRejectedValue(new Error('Connection failed'));

            await command.run(['@unraid/plugin'], { bundled: false, restart: true });

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to add plugin:', expect.any(Error));
            expect(process.exitCode).toBe(1);
        });

        it('should error when no package name provided', async () => {
            await command.run([], { bundled: false, restart: true });

            expect(mockLogger.error).toHaveBeenCalledWith('Package name is required.');
            expect(process.exitCode).toBe(1);
        });
    });

    describe('RemovePluginCommand', () => {
        let command: RemovePluginCommand;

        beforeEach(async () => {
            const module = await Test.createTestingModule({
                providers: [
                    RemovePluginCommand,
                    { provide: CliInternalClientService, useValue: mockInternalClient },
                    { provide: LogService, useValue: mockLogger },
                    { provide: RestartCommand, useValue: mockRestartCommand },
                ],
            }).compile();

            command = module.get<RemovePluginCommand>(RemovePluginCommand);
        });

        it('should remove a plugin successfully', async () => {
            const mockClient = {
                mutate: vi.fn().mockResolvedValue({
                    data: {
                        removePlugin: false, // No manual restart required
                    },
                }),
            };

            mockInternalClient.getClient.mockResolvedValue(mockClient);

            await command.run(['@unraid/plugin-example'], { bundled: false, restart: true });

            expect(mockClient.mutate).toHaveBeenCalledWith({
                mutation: expect.anything(),
                variables: {
                    input: {
                        names: ['@unraid/plugin-example'],
                        bundled: false,
                        restart: true,
                    },
                },
            });
            expect(mockLogger.log).toHaveBeenCalledWith('Removed plugin @unraid/plugin-example');
            expect(mockRestartCommand.run).not.toHaveBeenCalled();
        });

        it('should handle removing bundled plugins', async () => {
            const mockClient = {
                mutate: vi.fn().mockResolvedValue({
                    data: {
                        removePlugin: true, // Manual restart required
                    },
                }),
            };

            mockInternalClient.getClient.mockResolvedValue(mockClient);

            await command.run(['@unraid/bundled-plugin'], { bundled: true, restart: true });

            expect(mockLogger.log).toHaveBeenCalledWith('Removed bundled plugin @unraid/bundled-plugin');
            expect(mockRestartCommand.run).toHaveBeenCalled();
        });
    });

    describe('ListPluginCommand', () => {
        let command: ListPluginCommand;

        beforeEach(async () => {
            const module = await Test.createTestingModule({
                providers: [
                    ListPluginCommand,
                    { provide: CliInternalClientService, useValue: mockInternalClient },
                    { provide: LogService, useValue: mockLogger },
                ],
            }).compile();

            command = module.get<ListPluginCommand>(ListPluginCommand);
        });

        it('should list installed plugins', async () => {
            const mockClient = {
                query: vi.fn().mockResolvedValue({
                    data: {
                        plugins: [
                            {
                                name: '@unraid/plugin-1',
                                version: '1.0.0',
                                hasApiModule: true,
                                hasCliModule: false,
                            },
                            {
                                name: '@unraid/plugin-2',
                                version: '2.0.0',
                                hasApiModule: true,
                                hasCliModule: true,
                            },
                        ],
                    },
                }),
            };

            mockInternalClient.getClient.mockResolvedValue(mockClient);

            await command.run();

            expect(mockClient.query).toHaveBeenCalledWith({
                query: expect.anything(),
            });
            expect(mockLogger.log).toHaveBeenCalledWith('Installed plugins:\n');
            expect(mockLogger.log).toHaveBeenCalledWith('☑️ @unraid/plugin-1@1.0.0 [API]');
            expect(mockLogger.log).toHaveBeenCalledWith('☑️ @unraid/plugin-2@2.0.0 [API, CLI]');
            expect(mockLogger.log).toHaveBeenCalledWith();
        });

        it('should handle no plugins installed', async () => {
            const mockClient = {
                query: vi.fn().mockResolvedValue({
                    data: {
                        plugins: [],
                    },
                }),
            };

            mockInternalClient.getClient.mockResolvedValue(mockClient);

            await command.run();

            expect(mockLogger.log).toHaveBeenCalledWith('No plugins installed.');
        });

        it('should handle errors', async () => {
            mockInternalClient.getClient.mockRejectedValue(new Error('Connection failed'));

            await command.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to list plugins:', expect.any(Error));
            expect(process.exitCode).toBe(1);
        });
    });
});
