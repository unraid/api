import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { UPDATE_SSO_USERS_MUTATION } from '@app/unraid-api/cli/mutations/update-sso-users.mutation.js';
import { SSO_USERS_QUERY } from '@app/unraid-api/cli/queries/sso-users.query.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';
import {
    NoSSOUsersFoundError,
    RemoveSSOUserQuestionSet,
} from '@app/unraid-api/cli/sso/remove-sso-user.questions.js';

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
        private readonly internalClient: CliInternalClientService
    ) {
        super();
    }
    public async run(_input: string[], options?: RemoveSSOUserCommandOptions): Promise<void> {
        try {
            options = await this.inquirerService.prompt(RemoveSSOUserQuestionSet.name, options);
        } catch (error) {
            if (error instanceof NoSSOUsersFoundError) {
                this.logger.error(error.message);
                process.exit(0);
            } else if (error instanceof Error) {
                this.logger.error('Failed to fetch SSO users: %s', error.message);
                process.exit(1);
            } else {
                this.logger.error('An unexpected error occurred');
                process.exit(1);
            }
        }

        const client = await this.internalClient.getClient();

        const result = await client.query({
            query: SSO_USERS_QUERY,
        });

        const currentUsers = result.data?.settings?.api?.ssoSubIds || [];

        if (options.username === 'all') {
            await client.mutate({
                mutation: UPDATE_SSO_USERS_MUTATION,
                variables: {
                    input: {
                        api: {
                            ssoSubIds: [],
                        },
                    },
                },
            });
            this.logger.info('All users removed from SSO');
        } else {
            const updatedUsers = currentUsers.filter((id: string) => id !== options.username);

            if (updatedUsers.length === currentUsers.length) {
                this.logger.error(`User ${options.username} not found in SSO users`);
                return;
            }

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
