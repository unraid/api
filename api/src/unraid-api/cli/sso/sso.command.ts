import { Injectable } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';

import { LogService } from '@app/unraid-api/cli/log.service';
import { ValidateTokenCommand } from '@app/unraid-api/cli/sso/validate-token.command';
import { AddSSOUserCommand } from '@app/unraid-api/cli/sso/add-sso-user.command';
import { RemoveSSOUserCommand } from '@app/unraid-api/cli/sso/remove-sso-user.command';

@Injectable()
@Command({
    name: 'sso',
    description: 'Main Command to Configure / Validate SSO Tokens',
    subCommands: [ValidateTokenCommand, AddSSOUserCommand, RemoveSSOUserCommand],
})
export class SSOCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(): Promise<void> {
        this.logger.info('Please provide a subcommand or use --help for more information');
        process.exit(0);
    }
}
