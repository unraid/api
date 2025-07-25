import { Injectable } from '@nestjs/common';

import { CommandRunner, SubCommand } from 'nest-commander';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { SSO_USERS_QUERY } from '@app/unraid-api/cli/queries/sso-users.query.js';

@Injectable()
@SubCommand({
    name: 'list-users',
    aliases: ['list', 'l'],
    description: 'List all users for SSO',
})
export class ListSSOUserCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly internalClient: CliInternalClientService
    ) {
        super();
    }

    async run(_input: string[]): Promise<void> {
        const client = await this.internalClient.getClient();

        const result = await client.query({
            query: SSO_USERS_QUERY,
        });

        const users = result.data?.settings?.api?.ssoSubIds || [];

        if (users.length === 0) {
            this.logger.info('No SSO users found');
        } else {
            this.logger.info(users.join('\n'));
        }
    }
}
