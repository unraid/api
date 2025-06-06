import { Injectable } from '@nestjs/common';

import { CommandRunner, SubCommand } from 'nest-commander';

import { SsoUserService } from '@app/unraid-api/auth/sso-user.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@Injectable()
@SubCommand({
    name: 'list-users',
    aliases: ['list', 'l'],
    description: 'List all users for SSO',
})
export class ListSSOUserCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly ssoUserService: SsoUserService
    ) {
        super();
    }

    async run(_input: string[]): Promise<void> {
        const users = await this.ssoUserService.getSsoUsers();
        this.logger.info(users.join('\n'));
    }
}
