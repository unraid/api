import { Injectable } from '@nestjs/common';

import { Command, CommandRunner, InquirerService, Option } from 'nest-commander';

import { DeveloperToolsService } from '@app/unraid-api/cli/developer/developer-tools.service.js';
import { DeveloperQuestions } from '@app/unraid-api/cli/developer/developer.questions.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

interface DeveloperOptions {
    tool?: string;
    sandboxEnabled?: boolean;
    modalAction?: string;
    sandbox?: boolean;
    'enable-modal'?: boolean;
    'disable-modal'?: boolean;
}

@Injectable()
@Command({
    name: 'developer',
    description: 'Configure developer tools (GraphQL sandbox and modal testing)',
})
export class DeveloperCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly inquirerService: InquirerService,
        private readonly developerTools: DeveloperToolsService
    ) {
        super();
    }

    async run(_args: string[], options?: DeveloperOptions): Promise<void> {
        try {
            // Handle direct sandbox option for backwards compatibility
            if (options?.sandbox !== undefined) {
                await this.developerTools.setSandboxMode(options.sandbox);
                return;
            }

            // Handle direct modal options
            if (options?.['enable-modal']) {
                await this.developerTools.enableModalTest();
                this.showModalTestingGuide();
                return;
            }
            if (options?.['disable-modal']) {
                await this.developerTools.disableModalTest();
                return;
            }

            // Interactive mode
            const answers = await this.inquirerService.prompt<DeveloperOptions>(
                DeveloperQuestions.name,
                options
            );

            if (answers.tool === 'sandbox') {
                await this.developerTools.setSandboxMode(answers.sandboxEnabled || false);
            } else if (answers.tool === 'modal-test') {
                await this.handleModalTest(answers.modalAction || 'status');
            }
        } catch (error) {
            process.exit(1);
        }
    }

    private async handleModalTest(action: string): Promise<void> {
        switch (action) {
            case 'enable':
                await this.developerTools.enableModalTest();
                this.showModalTestingGuide();
                break;
            case 'disable':
                await this.developerTools.disableModalTest();
                break;
            case 'status':
            default:
                await this.showModalTestStatus();
                break;
        }
    }

    private async showModalTestStatus(): Promise<void> {
        const status = await this.developerTools.getModalTestStatus();

        this.logger.info('Modal Test Tool Status');
        this.logger.info('====================\n');
        this.logger.info(`Status: ${status.enabled ? 'ENABLED' : 'DISABLED'}`);

        if (status.enabled) {
            this.logger.info('\nAccess the tool at: Menu > UNRAID-OS > Dev Modal Test');
        }

        this.logger.info('\nTo enable: unraid-api developer --enable-modal');
        this.logger.info('To disable: unraid-api developer --disable-modal\n');

        this.showModalTestingGuide();
    }

    private showModalTestingGuide(): void {
        const guide = this.developerTools.getModalTestingGuide();
        guide.forEach((line) => this.logger.info(line));
    }

    @Option({
        flags: '--sandbox <boolean>',
        description: 'Enable or disable sandbox mode (true/false)',
    })
    parseSandbox(value: string): boolean {
        return value === 'true';
    }

    @Option({
        flags: '--enable-modal',
        description: 'Enable the modal test tool',
    })
    parseEnableModal(): boolean {
        return true;
    }

    @Option({
        flags: '--disable-modal',
        description: 'Disable the modal test tool',
    })
    parseDisableModal(): boolean {
        return true;
    }
}
