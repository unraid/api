import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';
import { v4 } from 'uuid';

import { store } from '@app/store/index.js';
import { addSsoUser, loadConfigFile } from '@app/store/modules/config.js';
import { writeConfigSync } from '@app/store/sync/config-disk-sync.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { AddSSOUserQuestionSet } from '@app/unraid-api/cli/sso/add-sso-user.questions.js';

interface AddSSOUserCommandOptions {
    disclaimer: string;
    username: string;
}

@Injectable()
@SubCommand({
    name: 'add-user',
    aliases: ['add', 'a'],
    description: 'Add a user for SSO',
})
export class AddSSOUserCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly inquirerService: InquirerService,
        private readonly restartCommand: RestartCommand
    ) {
        super();
    }

    async run(_input: string[], options: AddSSOUserCommandOptions): Promise<void> {
        try {
            options = await this.inquirerService.prompt(AddSSOUserQuestionSet.name, options);
            if (options.disclaimer === 'y' && options.username) {
                await store.dispatch(loadConfigFile());
                const shouldRestart = store.getState().config.remote.ssoSubIds.length === 0;
                store.dispatch(addSsoUser(options.username));
                writeConfigSync('flash');
                this.logger.info(`User added ${options.username}`);
                if (shouldRestart) {
                    this.logger.info('Restarting the Unraid API in 5 seconds to enable the SSO button');
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    await this.restartCommand.run([]);
                }
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                this.logger.error('Error adding user: ' + e.message);
            } else {
                this.logger.error('Error adding user');
            }
        }
    }

    @Option({
        flags: '--username <username>',
        description: 'Cognito Username',
    })
    parseUsername(input: string) {
        if (
            !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(input)
        ) {
            throw new Error(`Username must be in the format of a UUID (e.g., ${v4()}}\n`);
        }

        return input;
    }

    @Option({
        flags: '--disclaimer <disclaimer>',
        description: 'Disclaimer (y/n)',
    })
    parseDisclaimer(input: string) {
        if (!input || !['y', 'n'].includes(input.toLowerCase())) {
            throw new Error('Please answer the diclaimer with (y/n)\n');
        }
        if (input.toLowerCase() === 'n') {
            process.exit(1);
        }
        return input;
    }
}
