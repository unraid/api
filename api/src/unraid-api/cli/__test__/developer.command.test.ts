import { Test, TestingModule } from '@nestjs/testing';

import { InquirerService } from 'nest-commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeveloperToolsService } from '@app/unraid-api/cli/developer/developer-tools.service.js';
import { DeveloperCommand } from '@app/unraid-api/cli/developer/developer.command.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

describe('DeveloperCommand', () => {
    let module: TestingModule;
    let command: DeveloperCommand;
    let developerToolsService: DeveloperToolsService;
    let logService: LogService;
    let inquirerService: InquirerService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                DeveloperCommand,
                {
                    provide: DeveloperToolsService,
                    useValue: {
                        setSandboxMode: vi.fn(),
                        enableModalTest: vi.fn(),
                        disableModalTest: vi.fn(),
                        getModalTestStatus: vi.fn().mockResolvedValue({ enabled: false }),
                        getModalTestingGuide: vi.fn().mockReturnValue(['test guide']),
                    },
                },
                {
                    provide: LogService,
                    useValue: {
                        info: vi.fn(),
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

        command = module.get<DeveloperCommand>(DeveloperCommand);
        developerToolsService = module.get<DeveloperToolsService>(DeveloperToolsService);
        logService = module.get<LogService>(LogService);
        inquirerService = module.get<InquirerService>(InquirerService);
    });

    it('should handle sandbox option directly', async () => {
        await command.run([], { sandbox: true });

        expect(developerToolsService.setSandboxMode).toHaveBeenCalledWith(true);
    });

    it('should handle enable-modal option directly', async () => {
        await command.run([], { 'enable-modal': true });

        expect(developerToolsService.enableModalTest).toHaveBeenCalled();
        expect(logService.info).toHaveBeenCalledWith('test guide');
    });

    it('should handle disable-modal option directly', async () => {
        await command.run([], { 'disable-modal': true });

        expect(developerToolsService.disableModalTest).toHaveBeenCalled();
    });

    it('should show modal test status', async () => {
        vi.mocked(inquirerService.prompt).mockResolvedValue({
            tool: 'modal-test',
            modalAction: 'status',
        });

        await command.run([], {});

        expect(developerToolsService.getModalTestStatus).toHaveBeenCalled();
        expect(logService.info).toHaveBeenCalledWith('Modal Test Tool Status');
    });

    it('should handle sandbox selection in interactive mode', async () => {
        vi.mocked(inquirerService.prompt).mockResolvedValue({
            tool: 'sandbox',
            sandboxEnabled: true,
        });

        await command.run([], {});

        expect(developerToolsService.setSandboxMode).toHaveBeenCalledWith(true);
    });

    it('should handle modal test enable in interactive mode', async () => {
        vi.mocked(inquirerService.prompt).mockResolvedValue({
            tool: 'modal-test',
            modalAction: 'enable',
        });

        await command.run([], {});

        expect(developerToolsService.enableModalTest).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called');
        });

        vi.mocked(developerToolsService.setSandboxMode).mockRejectedValue(new Error('Test error'));

        await expect(command.run([], { sandbox: true })).rejects.toThrow('process.exit called');

        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
    });
});
