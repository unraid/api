import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';
import { v4 } from 'uuid';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { UPDATE_SSO_USERS_MUTATION } from '@app/unraid-api/cli/mutations/update-sso-users.mutation.js';
import { SSO_USERS_QUERY } from '@app/unraid-api/cli/queries/sso-users.query.js';
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
        private readonly internalClient: CliInternalClientService
    ) {
        super();
    }

    async run(_input: string[], options?: AddSSOUserCommandOptions): Promise<void> {
        try {
            options = await this.inquirerService.prompt(AddSSOUserQuestionSet.name, options);
            if (options.disclaimer === 'y' && options.username) {
                const client = await this.internalClient.getClient();

                const result = await client.query({
                    query: SSO_USERS_QUERY,
                });

                const currentUsers = result.data?.settings?.api?.ssoSubIds || [];

                if (currentUsers.includes(options.username)) {
                    this.logger.error(`User ${options.username} already exists in SSO users`);
                    return;
                }

                const updatedUsers = [...currentUsers, options.username];

                await client.mutate({
                    mutation: UPDATE_SSO_USERS_MUTATION,
                    variables: {
                        input: {
                            api: {
                                ssoSubIds: updatedUsers,
                            },
                        },
                    },
                });

                this.logger.info(`User added: ${options.username}`);
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
