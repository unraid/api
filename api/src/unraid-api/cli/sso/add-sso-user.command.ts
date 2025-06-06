import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';
import { v4 } from 'uuid';

import { SsoUserService } from '@app/unraid-api/auth/sso-user.service.js';
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
        private readonly restartCommand: RestartCommand,
        private readonly ssoUserService: SsoUserService
    ) {
        super();
    }

    async run(_input: string[], options: AddSSOUserCommandOptions): Promise<void> {
        try {
            options = await this.inquirerService.prompt(AddSSOUserQuestionSet.name, options);
            if (options.disclaimer === 'y' && options.username) {
                await this.ssoUserService.addSsoUser(options.username);
                this.logger.info(`User added ${options.username}, restarting the API`);
                await this.restartCommand.run();
            }
        } catch (e: unknown) {
            this.logger.error('Error adding user:', e);
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
