import { Test } from '@nestjs/testing';

import { InquirerService } from 'nest-commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import {
    InstallPluginCommand,
    ListPluginCommand,
    RemovePluginCommand,
} from '@app/unraid-api/cli/plugins/plugin.command.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { PluginManagementService } from '@app/unraid-api/plugin/plugin-management.service.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

// Mock services
const mockInternalClient = {
    getClient: vi.fn(),
};

const mockLogger = {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    table: vi.fn(),
};

const mockRestartCommand = {
    run: vi.fn(),
};

const mockPluginManagementService = {
    addPlugin: vi.fn(),
    addBundledPlugin: vi.fn(),
    removePlugin: vi.fn(),
    removeBundledPlugin: vi.fn(),
    plugins: [] as string[],
};

const mockInquirerService = {
    prompt: vi.fn(),
};

vi.mock('@app/unraid-api/plugin/plugin.service.js', () => ({
    PluginService: {
        listPlugins: vi.fn(),
    },
}));

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
                    { provide: LogService, useValue: mockLogger },
                    { provide: RestartCommand, useValue: mockRestartCommand },
                    { provide: PluginManagementService, useValue: mockPluginManagementService },
                ],
            }).compile();

            command = module.get<InstallPluginCommand>(InstallPluginCommand);
        });

        it('should install a plugin successfully', async () => {
            await command.run(['@unraid/plugin-example'], { bundled: false, restart: true });

            expect(mockPluginManagementService.addPlugin).toHaveBeenCalledWith('@unraid/plugin-example');
            expect(mockLogger.log).toHaveBeenCalledWith('Added plugin @unraid/plugin-example');
            expect(mockRestartCommand.run).toHaveBeenCalled();
        });

        it('should handle bundled plugin installation', async () => {
            await command.run(['@unraid/bundled-plugin'], { bundled: true, restart: true });

            expect(mockPluginManagementService.addBundledPlugin).toHaveBeenCalledWith(
                '@unraid/bundled-plugin'
            );
            expect(mockLogger.log).toHaveBeenCalledWith('Added bundled plugin @unraid/bundled-plugin');
            expect(mockRestartCommand.run).toHaveBeenCalled();
        });

        it('should not restart when restart option is false', async () => {
            await command.run(['@unraid/plugin'], { bundled: false, restart: false });

            expect(mockPluginManagementService.addPlugin).toHaveBeenCalledWith('@unraid/plugin');
            expect(mockRestartCommand.run).not.toHaveBeenCalled();
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
                    { provide: LogService, useValue: mockLogger },
                    { provide: PluginManagementService, useValue: mockPluginManagementService },
                    { provide: RestartCommand, useValue: mockRestartCommand },
                    { provide: InquirerService, useValue: mockInquirerService },
                ],
            }).compile();

            command = module.get<RemovePluginCommand>(RemovePluginCommand);
        });

        it('should remove plugins successfully', async () => {
            mockInquirerService.prompt.mockResolvedValue({
                plugins: ['@unraid/plugin-example', '@unraid/plugin-test'],
                restart: true,
            });

            await command.run([], { restart: true });

            expect(mockPluginManagementService.removePlugin).toHaveBeenCalledWith(
                '@unraid/plugin-example',
                '@unraid/plugin-test'
            );
            expect(mockLogger.log).toHaveBeenCalledWith('Removed plugin @unraid/plugin-example');
            expect(mockLogger.log).toHaveBeenCalledWith('Removed plugin @unraid/plugin-test');
            expect(mockRestartCommand.run).toHaveBeenCalled();
        });

        it('should handle when no plugins are selected', async () => {
            mockInquirerService.prompt.mockResolvedValue({
                plugins: [],
                restart: true,
            });

            await command.run([], { restart: true });

            expect(mockLogger.warn).toHaveBeenCalledWith('No plugins selected for removal.');
            expect(mockPluginManagementService.removePlugin).not.toHaveBeenCalled();
            expect(mockRestartCommand.run).not.toHaveBeenCalled();
        });

        it('should skip restart when --no-restart is specified', async () => {
            mockInquirerService.prompt.mockResolvedValue({
                plugins: ['@unraid/plugin-example'],
                restart: false,
            });

            await command.run([], { restart: false });

            expect(mockPluginManagementService.removePlugin).toHaveBeenCalledWith(
                '@unraid/plugin-example'
            );
            expect(mockRestartCommand.run).not.toHaveBeenCalled();
        });
    });

    describe('ListPluginCommand', () => {
        let command: ListPluginCommand;

        beforeEach(async () => {
            const module = await Test.createTestingModule({
                providers: [
                    ListPluginCommand,
                    { provide: LogService, useValue: mockLogger },
                    { provide: PluginManagementService, useValue: mockPluginManagementService },
                ],
            }).compile();

            command = module.get<ListPluginCommand>(ListPluginCommand);
        });

        it('should list installed plugins', async () => {
            vi.mocked(PluginService.listPlugins).mockResolvedValue([
                ['@unraid/plugin-1', '1.0.0'],
                ['@unraid/plugin-2', '2.0.0'],
            ]);
            mockPluginManagementService.plugins = ['@unraid/plugin-1', '@unraid/plugin-2'];

            await command.run();

            expect(mockLogger.log).toHaveBeenCalledWith('Installed plugins:\n');
            expect(mockLogger.log).toHaveBeenCalledWith('☑️ @unraid/plugin-1@1.0.0');
            expect(mockLogger.log).toHaveBeenCalledWith('☑️ @unraid/plugin-2@2.0.0');
            expect(mockLogger.log).toHaveBeenCalledWith();
        });

        it('should handle no plugins installed', async () => {
            vi.mocked(PluginService.listPlugins).mockResolvedValue([]);
            mockPluginManagementService.plugins = [];

            await command.run();

            expect(mockLogger.log).toHaveBeenCalledWith('No plugins installed.');
        });

        it('should warn about plugins not installed', async () => {
            vi.mocked(PluginService.listPlugins).mockResolvedValue([['@unraid/plugin-1', '1.0.0']]);
            mockPluginManagementService.plugins = ['@unraid/plugin-1', '@unraid/plugin-2'];

            await command.run();

            expect(mockLogger.warn).toHaveBeenCalledWith('1 plugins are not installed:');
            expect(mockLogger.table).toHaveBeenCalledWith('warn', ['@unraid/plugin-2']);
        });
    });
});
