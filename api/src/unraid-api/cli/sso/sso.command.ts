import { Injectable } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import { ValidateTokenCommand } from '@app/unraid-api/cli/sso/validate-token.command.js';

@Injectable()
@Command({
    name: 'sso',
    description: 'SSO Token Validation Command',
    subCommands: [ValidateTokenCommand],
})
export class SSOCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(): Promise<void> {
        this.logger.info('SSO Token Validation Command');
        this.logger.info('');
        this.logger.info('To configure SSO providers and authorization rules:');
        this.logger.info('  Go to Settings -> Management Access in the WebGUI');
        this.logger.info('');
        this.logger.info('Available subcommands:');
        this.logger.info('  validate-token <token>  - Validate an SSO session token');
        this.logger.info('');
        this.logger.info('Use --help for more information');
        process.exit(0);
    }
}
