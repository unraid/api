import { Test, TestingModule } from '@nestjs/testing';
import { access, unlink, writeFile } from 'fs/promises';

import type { CanonicalInternalClientService } from '@unraid/shared';
import { CANONICAL_INTERNAL_CLIENT_TOKEN } from '@unraid/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeveloperToolsService } from '@app/unraid-api/cli/developer/developer-tools.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';

vi.mock('fs/promises');

describe('DeveloperToolsService', () => {
    let module: TestingModule;
    let service: DeveloperToolsService;
    let logService: LogService;
    let restartCommand: RestartCommand;
    let internalClient: CanonicalInternalClientService;

    const mockClient = {
        mutate: vi.fn(),
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        module = await Test.createTestingModule({
            providers: [
                DeveloperToolsService,
                {
                    provide: LogService,
                    useValue: {
                        info: vi.fn(),
                        error: vi.fn(),
                        warn: vi.fn(),
                    },
                },
                {
                    provide: RestartCommand,
                    useValue: {
                        run: vi.fn(),
                    },
                },
                {
                    provide: CANONICAL_INTERNAL_CLIENT_TOKEN,
                    useValue: {
                        getClient: vi.fn().mockResolvedValue(mockClient),
                    },
                },
            ],
        }).compile();

        service = module.get<DeveloperToolsService>(DeveloperToolsService);
        logService = module.get<LogService>(LogService);
        restartCommand = module.get<RestartCommand>(RestartCommand);
        internalClient = module.get<CanonicalInternalClientService>(CANONICAL_INTERNAL_CLIENT_TOKEN);
    });

    describe('setSandboxMode', () => {
        it('should enable sandbox mode and restart when required', async () => {
            mockClient.mutate.mockResolvedValue({
                data: {
                    updateSettings: {
                        restartRequired: true,
                    },
                },
            });

            await service.setSandboxMode(true);

            expect(mockClient.mutate).toHaveBeenCalledWith({
                mutation: expect.any(Object),
                variables: {
                    input: {
                        api: {
                            sandbox: true,
                        },
                    },
                },
            });
            expect(logService.info).toHaveBeenCalledWith('Enabling sandbox mode - restarting API...');
            expect(restartCommand.run).toHaveBeenCalled();
        });

        it('should disable sandbox mode without restart', async () => {
            mockClient.mutate.mockResolvedValue({
                data: {
                    updateSettings: {
                        restartRequired: false,
                    },
                },
            });

            await service.setSandboxMode(false);

            expect(logService.info).toHaveBeenCalledWith('Sandbox mode disabled successfully.');
            expect(restartCommand.run).not.toHaveBeenCalled();
        });
    });

    describe('enableModalTest', () => {
        it('should create modal test page file', async () => {
            vi.mocked(access).mockResolvedValue(undefined);
            vi.mocked(writeFile).mockResolvedValue(undefined);

            await service.enableModalTest();

            expect(access).toHaveBeenCalledWith('/usr/local/emhttp/plugins/dynamix.my.servers');
            expect(writeFile).toHaveBeenCalledWith(
                '/usr/local/emhttp/plugins/dynamix.my.servers/DevModalTest.page',
                expect.stringContaining('unraid-dev-modal-test')
            );
            expect(logService.info).toHaveBeenCalledWith('✓ Modal test tool ENABLED');
            expect(logService.info).toHaveBeenCalledWith(
                '\nAccess the tool at: Menu > UNRAID-OS > Dev Modal Test'
            );
        });

        it('should throw error if directory does not exist', async () => {
            vi.mocked(access).mockRejectedValue(new Error('ENOENT'));

            await expect(service.enableModalTest()).rejects.toThrow(
                'Directory does not exist: /usr/local/emhttp/plugins/dynamix.my.servers'
            );
        });
    });

    describe('disableModalTest', () => {
        it('should remove modal test page file', async () => {
            vi.mocked(access).mockResolvedValue(undefined);
            vi.mocked(unlink).mockResolvedValue(undefined);

            await service.disableModalTest();

            expect(unlink).toHaveBeenCalledWith(
                '/usr/local/emhttp/plugins/dynamix.my.servers/DevModalTest.page'
            );
            expect(logService.info).toHaveBeenCalledWith('✓ Modal test tool DISABLED');
        });

        it('should handle file not existing', async () => {
            vi.mocked(access).mockRejectedValue(new Error('ENOENT'));

            await service.disableModalTest();

            expect(unlink).not.toHaveBeenCalled();
            expect(logService.info).toHaveBeenCalledWith('Modal test tool is already disabled.');
        });
    });

    describe('isModalTestEnabled', () => {
        it('should return true if file exists', async () => {
            vi.mocked(access).mockResolvedValue(undefined);

            const result = await service.isModalTestEnabled();

            expect(result).toBe(true);
        });

        it('should return false if file does not exist', async () => {
            vi.mocked(access).mockRejectedValue(new Error('ENOENT'));

            const result = await service.isModalTestEnabled();

            expect(result).toBe(false);
        });
    });

    describe('getModalTestStatus', () => {
        it('should return enabled status', async () => {
            vi.mocked(access).mockResolvedValue(undefined);

            const result = await service.getModalTestStatus();

            expect(result).toEqual({
                enabled: true,
            });
        });

        it('should return disabled status', async () => {
            vi.mocked(access).mockRejectedValue(new Error('ENOENT'));

            const result = await service.getModalTestStatus();

            expect(result).toEqual({
                enabled: false,
            });
        });
    });

    describe('getModalTestingGuide', () => {
        it('should return modal testing guide', () => {
            const guide = service.getModalTestingGuide();

            expect(guide).toBeInstanceOf(Array);
            expect(guide[0]).toBe('Modal Testing Guide');
            expect(guide).toContainEqual('  - Show/hide the Activation Modal');
        });
    });
});
