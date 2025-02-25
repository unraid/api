import { Command, CommandRunner } from 'nest-commander';

import { API_VERSION } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@Command({ name: 'version' })
export class VersionCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }
    async run(): Promise<void> {
        this.logger.info(`Unraid API v${API_VERSION}`);
    }
}
