import { execa } from 'execa';
import { Command, CommandRunner } from 'nest-commander';

import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { LogService } from '@app/unraid-api/cli/log.service';

@Command({ name: 'restart', description: 'Restart / Start the Unraid API' })
export class RestartCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(_): Promise<void> {
        try {
            this.logger.info('Restarting the Unraid API...');
            const { stderr, stdout } = await execa(PM2_PATH, [
                'restart',
                ECOSYSTEM_PATH,
                '--update-env',
            ]);
            if (stderr) {
                this.logger.error(stderr);
                process.exit(1);
            } else if (stdout) {
                this.logger.info(stdout);
            } else {
                this.logger.info('Unraid API restarted');
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(error.message);
            } else {
                this.logger.error('Unknown error occurred');
            }
            process.exit(1);
        }
        process.exit(0);
    }
}
