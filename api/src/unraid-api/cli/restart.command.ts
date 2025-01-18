import { execa } from 'execa';
import { Command, CommandRunner } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { LogService } from '@app/unraid-api/cli/log.service';

/**
 * Stop a running API process and then start it again.
 */
@Command({ name: 'restart', description: 'Restart / Start the Unraid API' })
export class RestartCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(_): Promise<void> {
        const { stderr, stdout } = await execa(PM2_PATH, ['restart', ECOSYSTEM_PATH]);
        if (stderr) {
            this.logger.error(stderr);
            process.exit(1);
        }
        if (stdout) {
            this.logger.info(stdout);
        }
        process.exit(0);
    }
}
