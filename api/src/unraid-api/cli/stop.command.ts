import { execa } from 'execa';
import { Command, CommandRunner } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { LogService } from '@app/unraid-api/cli/log.service';

@Command({
    name: 'stop',
})
export class StopCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }
    async run() {
        const { stderr, stdout } = await execa(PM2_PATH, ['stop', ECOSYSTEM_PATH]);
        if (stdout) {
            this.logger.info(stdout);
        } else if (stderr) {
            this.logger.warn(stderr);
            process.exit(1);
        }
    }
}
