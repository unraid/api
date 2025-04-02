import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, OptionChoiceFor, SubCommand } from 'nest-commander';

import { store } from '@app/store/index.js';
import { loadConfigFile, removeSsoUser } from '@app/store/modules/config.js';
import { writeConfigSync } from '@app/store/sync/config-disk-sync.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RemoveSSOUserQuestionSet } from '@app/unraid-api/cli/sso/remove-sso-user.questions.js';
import { StopCommand } from '@app/unraid-api/cli/stop.command.js';
import { StartCommand } from '@app/unraid-api/cli/start.command.js';

interface RemoveSSOUserCommandOptions {
    username: string;
}

@Injectable()
@SubCommand({
    name: 'remove-user',
    aliases: ['remove', 'r'],
    description: 'Remove a user (or all users) from SSO',
})
export class RemoveSSOUserCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly inquirerService: InquirerService,
        private readonly stopCommand: StopCommand,
        private readonly startCommand: StartCommand
    ) {
        super();
    }
    public async run(_input: string[], options: RemoveSSOUserCommandOptions): Promise<void> {
        await store.dispatch(loadConfigFile());
        options = await this.inquirerService.prompt(RemoveSSOUserQuestionSet.name, options);

        await this.stopCommand.run([]);
        store.dispatch(removeSsoUser(options.username === 'all' ? null : options.username));
        if (options.username === 'all') {
            this.logger.info('All users removed from SSO');
        } else {
            this.logger.info('User removed: ' + options.username);
        }
        writeConfigSync('flash');
        await this.startCommand.run([], {});
    }

    @Option({
        name: 'username',
        flags: '--username <username>',
        description: 'Cognito Username',
    })
    parseUsername(input: string) {
        if (!input) {
            throw new Error('Username is required\n');
        }

        if (
            !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(input)
        ) {
            throw new Error('Username must be in the format of a UUID (e.g., ${v4()}}\n');
        }

        return input;
    }
}
