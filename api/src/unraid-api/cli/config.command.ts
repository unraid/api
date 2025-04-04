import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { Command, CommandRunner } from 'nest-commander';

import { getters } from '@app/store/index.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PathsConfig } from '../../config/paths.config.js';

@Injectable()
@Command({
    name: 'config',
    description: 'Display current configuration values',
})
export class ConfigCommand extends CommandRunner {
    constructor(private readonly logger: LogService, private readonly paths: PathsConfig) {
        super();
    }

    async run(): Promise<void> {
        this.logger.log('\nDisk Configuration:');
        const diskConfig = await readFile(this.paths.myserversConfig, 'utf8');
        this.logger.log(diskConfig);
        process.exit(0);
    }
}
