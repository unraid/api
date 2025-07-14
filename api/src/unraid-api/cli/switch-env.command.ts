import { copyFile } from 'fs/promises';
import { join } from 'path';

import { Command, CommandRunner, Option } from 'nest-commander';

import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
import { ENVIRONMENT } from '@app/environment.js';
import { getters } from '@app/store/index.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestartCommand } from '@app/unraid-api/cli/restart.command.js';

interface SwitchEnvOptions {
    environment?: 'staging' | 'production';
}

@Command({
    name: 'switch-env',
    description: 'Switch the active Unraid API environment',
})
export class SwitchEnvCommand extends CommandRunner {
    private parseStringToEnv(environment: string): 'production' | 'staging' {
        return ['production', 'staging'].includes(environment)
            ? (environment as 'production' | 'staging')
            : 'production';
    }

    @Option({ flags: '-e, --environment <environment>' })
    getEnvOption(environment: string): 'production' | 'staging' {
        return this.parseStringToEnv(environment);
    }

    constructor(
        private readonly logger: LogService,
        private readonly restartCommand: RestartCommand
    ) {
        super();
    }

    async run(_, options: SwitchEnvOptions): Promise<void> {
        const paths = getters.paths();
        const basePath = paths['unraid-api-base'];
        const currentEnvPath = join(basePath, '.env');

        // Determine target environment
        const currentEnv = ENVIRONMENT;
        const targetEnv = options.environment ?? 'production';

        this.logger.info(`Switching environment from ${currentEnv} to ${targetEnv}`);

        // Check if target environment file exists
        const sourceEnvPath = join(basePath, `.env.${targetEnv}`);
        if (!fileExistsSync(sourceEnvPath)) {
            this.logger.error(
                `Environment file ${sourceEnvPath} does not exist. Cannot switch to ${targetEnv} environment.`
            );
            process.exit(1);
        }

        // Copy the target environment file to .env
        this.logger.debug(`Copying ${sourceEnvPath} to ${currentEnvPath}`);
        try {
            await copyFile(sourceEnvPath, currentEnvPath);
            this.logger.info(`Successfully switched to ${targetEnv} environment`);
        } catch (error) {
            this.logger.error(`Failed to copy environment file: ${error}`);
            process.exit(1);
        }

        // Restart the API to pick up the new environment
        this.logger.info('Restarting Unraid API to apply environment changes...');
        await this.restartCommand.run();
    }
}
