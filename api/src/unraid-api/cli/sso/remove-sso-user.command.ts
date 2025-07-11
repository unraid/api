import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';

import { SsoUserService } from '@app/unraid-api/auth/sso-user.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import { RemoveSSOUserQuestionSet } from '@app/unraid-api/cli/sso/remove-sso-user.questions.js';

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
        private readonly restartCommand: RestartCommand,
        private readonly ssoUserService: SsoUserService
    ) {
        super();
    }
    public async run(_input: string[], options: RemoveSSOUserCommandOptions): Promise<void> {
        options = await this.inquirerService.prompt(RemoveSSOUserQuestionSet.name, options);
        if (options.username === 'all') {
            await this.ssoUserService.removeAllSsoUsers();
            this.logger.info('All users removed from SSO');
        } else {
            await this.ssoUserService.removeSsoUser(options.username);
            this.logger.info('User removed: ' + options.username);
        }
        this.logger.info('Restarting the API');
        await this.restartCommand.run();
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
