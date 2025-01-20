import { Injectable } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';

import { LogService } from '@app/unraid-api/cli/log.service';
import { ValidateTokenCommand } from '@app/unraid-api/cli/validate-token.command';

@Injectable()
@Command({
    name: 'sso',
    description: 'Main Command to Configure / Validate SSO Tokens',
    subCommands: [ValidateTokenCommand],
})
export class SSOCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(): Promise<void> {
        this.logger.info('Please provide a subcommand or use --help for more information');
    }
}
