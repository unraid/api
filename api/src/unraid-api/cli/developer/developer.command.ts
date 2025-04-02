import { Injectable } from '@nestjs/common';

import { Command, CommandRunner, InquirerService } from 'nest-commander';

import { loadConfigFile, updateUserConfig } from '@app/store/modules/config.js';
import { writeConfigSync } from '@app/store/sync/config-disk-sync.js';
import { DeveloperQuestions } from '@app/unraid-api/cli/developer/developer.questions.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { StopCommand } from '@app/unraid-api/cli/stop.command.js';
import { StartCommand } from '@app/unraid-api/cli/start.command.js';

interface DeveloperOptions {
    disclaimer: boolean;
    sandbox: boolean;
}
@Injectable()
@Command({
    name: 'developer',
    description: 'Configure Developer Features for the API',
})
export class DeveloperCommand extends CommandRunner {
    constructor(
        private logger: LogService,
        private readonly inquirerService: InquirerService,
        private readonly startCommand: StartCommand,
        private readonly stopCommand: StopCommand
    ) {
        super();
    }
    async run(_, options?: DeveloperOptions): Promise<void> {
        options = await this.inquirerService.prompt(DeveloperQuestions.name, options);
        if (!options.disclaimer) {
            this.logger.warn('No changes made, disclaimer not accepted.');
            process.exit(1);
        }
        const { store } = await import('@app/store/index.js');
        await store.dispatch(loadConfigFile());
        await this.stopCommand.run([]);
        store.dispatch(updateUserConfig({ local: { sandbox: options.sandbox ? 'yes' : 'no' } }));
        writeConfigSync('flash');

        this.logger.info(
            'Updated Developer Configuration - restart the API in 5 seconds to apply them...'
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await this.startCommand.run([], {});
    }
}
