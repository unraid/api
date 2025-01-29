import { Injectable } from '@nestjs/common';

import { Command, CommandRunner, InquirerService } from 'nest-commander';

import { loadConfigFile, updateUserConfig } from '@app/store/modules/config';
import { writeConfigSync } from '@app/store/sync/config-disk-sync';
import { DeveloperQuestions } from '@app/unraid-api/cli/developer/developer.questions';
import { LogService } from '@app/unraid-api/cli/log.service';

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
        private readonly inquirerService: InquirerService
    ) {
        super();
    }
    async run(_, options?: DeveloperOptions): Promise<void> {
        options = await this.inquirerService.prompt(DeveloperQuestions.name, options);
        if (!options.disclaimer) {
            this.logger.warn('No changes made, disclaimer not accepted.');
            process.exit(1);
        }
        const { store } = await import('@app/store');
        await store.dispatch(loadConfigFile());
        store.dispatch(updateUserConfig({ local: { sandbox: options.sandbox ? 'yes' : 'no' } }));
        console.log(store.getState().config.local.sandbox);
        writeConfigSync('flash');

        this.logger.info('Updated Developer Configuration');
    }
}
