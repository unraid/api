import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

import { execa } from 'execa';
import { Command, CommandRunner, Option } from 'nest-commander';

import type { LogLevel } from '@app/core/log';
import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';
import { levels } from '@app/core/log';
import { LogService } from '@app/unraid-api/cli/log.service';
import { LOG_LEVEL, NODE_ENV } from '@app/environment';

interface StartCommandOptions {
    'log-level'?: string;
}

@Command({ name: 'start' })
export class StartCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async configurePm2(): Promise<void> {
        if (existsSync('/tmp/pm2-configured')) {
            this.logger.debug('PM2 already configured');
            return;
        }
        // Write a temp file when first started to prevent needing to run this again
        // Install PM2 Logrotate
        await execa(PM2_PATH, ['install', 'pm2-logrotate'])
            .then(({ stdout }) => {
                this.logger.debug(stdout);
            })
            .catch(({ stderr }) => {
                this.logger.error('PM2 Logrotate Error: ' + stderr);
            });
        // Now set logrotate options
        await execa(PM2_PATH, ['set', 'pm2-logrotate:retain', '2'])
            .then(({ stdout }) => this.logger.debug(stdout))
            .catch(({ stderr }) => this.logger.error('PM2 Logrotate Set Error: ' + stderr));
        await execa(PM2_PATH, ['set', 'pm2-logrotate:compress', 'true'])
            .then(({ stdout }) => this.logger.debug(stdout))
            .catch(({ stderr }) => this.logger.error('PM2 Logrotate Compress Error: ' + stderr));
        await execa(PM2_PATH, ['set', 'pm2-logrotate:max_size', '1M'])
            .then(({ stdout }) => this.logger.debug(stdout))
            .catch(({ stderr }) => this.logger.error('PM2 Logrotate Max Size Error: ' + stderr));

        // PM2 Save Settings
        await execa(PM2_PATH, ['set', 'pm2:autodump', 'true'])
            .then(({ stdout }) => this.logger.debug(stdout))
            .catch(({ stderr }) => this.logger.error('PM2 Autodump Error: ' + stderr));

        // Update PM2
        await execa(PM2_PATH, ['update'])
            .then(({ stdout }) => this.logger.debug(stdout))
            .catch(({ stderr }) => this.logger.error('PM2 Update Error: ' + stderr));

        await writeFile('/tmp/pm2-configured', 'true');
    }

    async run(_: string[], options: StartCommandOptions): Promise<void> {
        this.logger.info('Starting the Unraid API');
        await this.configurePm2();

        const envLog = options['log-level'] ? `LOG_LEVEL=${options['log-level']}` : '';
        const { stderr, stdout } = await execa(`${envLog} ${PM2_PATH}`.trim(), [
            'start',
            ECOSYSTEM_PATH,
            '--update-env',
        ]);
        if (stdout) {
            this.logger.log(stdout);
        }
        if (stderr) {
            this.logger.error(stderr);
            process.exit(1);
        }
        process.exit(0);
    }

    @Option({
        flags: `--log-level <${levels.join('|')}>`,
        description: 'log level to use',
        defaultValue: 'info',
    })
    parseLogLevel(val: string): LogLevel {
        return levels.includes(val as LogLevel) ? (val as LogLevel) : 'info';
    }
}
