import { copyFile, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { Command, CommandRunner, Option } from 'nest-commander';

import { cliLogger } from '@app/core/log';
import { getters } from '@app/store';
import { LogService } from '@app/unraid-api/cli/log.service';
import { StartCommand } from '@app/unraid-api/cli/start.command';
import { StopCommand } from '@app/unraid-api/cli/stop.command';

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
        private readonly stopCommand: StopCommand,
        private readonly startCommand: StartCommand
    ) {
        super();
    }

    private async getEnvironmentFromFile(path: string): Promise<'production' | 'staging'> {
        const envFile = await readFile(path, 'utf-8').catch(() => '');
        this.logger.debug(`Checking ${path} for current ENV, found ${envFile}`);

        // Match the env file env="production" which would be [0] = env="production", [1] = env and [2] = production
        const matchArray = /([a-zA-Z]+)=["]*([a-zA-Z]+)["]*/.exec(envFile);
        // Get item from index 2 of the regex match or return production
        const [, , currentEnvInFile] = matchArray && matchArray.length === 3 ? matchArray : [];
        return this.parseStringToEnv(currentEnvInFile);
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
        const envFlashFilePath = paths['myservers-env'];

        this.logger.warn('Stopping the Unraid API');
        try {
            await this.stopCommand.run();
        } catch (err) {
            this.logger.warn('Failed to stop the Unraid API (maybe already stopped?)');
        }

        const newEnv =
            options.environment ??
            this.switchToOtherEnv(await this.getEnvironmentFromFile(envFlashFilePath));
        this.logger.info(`Setting environment to ${newEnv}`);

        // Write new env to flash
        const newEnvLine = `env="${newEnv}"`;
        this.logger.debug('Writing %s to %s', newEnvLine, envFlashFilePath);
        await writeFile(envFlashFilePath, newEnvLine);

        // Copy the new env over to live location before restarting
        const source = join(basePath, `.env.${newEnv}`);
        const destination = join(basePath, '.env');

        cliLogger.debug('Copying %s to %s', source, destination);
        await copyFile(source, destination);

        cliLogger.info('Now using %s', newEnv);
        await this.startCommand.run([], {});
    }
}
