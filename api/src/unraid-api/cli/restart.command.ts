import { Command, CommandRunner } from 'nest-commander';

import { ECOSYSTEM_PATH } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { PM2Service } from '@app/unraid-api/cli/pm2.service.js';

@Command({ name: 'restart', description: 'Restart the Unraid API' })
export class RestartCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly pm2: PM2Service
    ) {
        super();
    }

    async run(): Promise<void> {
        try {
            this.logger.info('Restarting the Unraid API...');
            const { stderr, stdout } = await this.pm2.run(
                { tag: 'PM2 Restart', raw: true },
                'restart',
                ECOSYSTEM_PATH,
                '--update-env'
            );

            if (stderr) {
                this.logger.error(stderr.toString());
                process.exit(1);
            } else if (stdout) {
                this.logger.info(stdout.toString());
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
    }
}
