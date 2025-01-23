import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';

import { store } from '@app/store/index';
import { addSsoUser, loadConfigFile } from '@app/store/modules/config';
import { writeConfigSync } from '@app/store/sync/config-disk-sync';
import { LogService } from '@app/unraid-api/cli/log.service';
import { AddSSOUserQuestionSet } from '@app/unraid-api/cli/sso/add-sso-user.questions';

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
        private readonly inquirerService: InquirerService
    ) {
        super();
    }

    async run(_input: string[], options: AddSSOUserCommandOptions): Promise<void> {
        try {
            options = await this.inquirerService.prompt(AddSSOUserQuestionSet.name, options);
            console.log(options);
            if (options.disclaimer === 'y' && options.username) {
                await store.dispatch(loadConfigFile());
                store.dispatch(addSsoUser(options.username));
                writeConfigSync('flash');
                this.logger.info('User added ' + options.username);
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
            throw new Error('Username must be in the format of a UUID (e.g., ${v4()}}\n');
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
