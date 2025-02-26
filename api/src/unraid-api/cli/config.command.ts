import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { Command, CommandRunner } from 'nest-commander';

import { getters } from '@app/store/index.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@Injectable()
@Command({
    name: 'config',
    description: 'Display current configuration values',
})
export class ConfigCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(): Promise<void> {
        this.logger.log('\nDisk Configuration:');
        const diskConfig = await readFile(getters.paths()['myservers-config'], 'utf8');
        this.logger.log(diskConfig);
        process.exit(0);
    }
}
