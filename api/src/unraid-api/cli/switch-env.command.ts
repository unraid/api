import { copyFile, readFile } from 'fs/promises';
import { join } from 'path';

import { Command, CommandRunner, Option } from 'nest-commander';

import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
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

    private async getCurrentEnvironmentFromEnvFile(
        envFilePath: string
    ): Promise<'production' | 'staging'> {
        try {
            const envFileContent = await readFile(envFilePath, 'utf-8');
            this.logger.debug(`Checking ${envFilePath} for current environment indicators`);

            // Look for common environment indicators in the .env file
            // This is a heuristic approach since .env files don't always have explicit env markers
            if (envFileContent.includes('NODE_ENV=staging') || envFileContent.includes('staging')) {
                return 'staging';
            }
            if (
                envFileContent.includes('NODE_ENV=production') ||
                envFileContent.includes('production')
            ) {
                return 'production';
            }

            // Default to production if we can't determine
            return 'production';
        } catch (error) {
            this.logger.debug(`Could not read ${envFilePath}, defaulting to production`);
            return 'production';
        }
    }

    private switchToOtherEnv(environment: 'production' | 'staging'): 'production' | 'staging' {
        if (environment === 'production') {
            return 'staging';
        }
        return 'production';
    }

    async run(_, options: SwitchEnvOptions): Promise<void> {
        const paths = getters.paths();
        const basePath = paths['unraid-api-base'];
        const currentEnvPath = join(basePath, '.env');

        // Determine target environment
        const currentEnv = await this.getCurrentEnvironmentFromEnvFile(currentEnvPath);
        const targetEnv = options.environment ?? this.switchToOtherEnv(currentEnv);

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
