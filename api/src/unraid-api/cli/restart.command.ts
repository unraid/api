import { PM2_PATH } from '@app/consts';
import { execSync } from 'child_process';
import { Command, CommandRunner } from 'nest-commander';
import { join } from 'path';

/**
 * Stop a running API process and then start it again.
 */
@Command({ name: 'restart', description: 'Restart / Start the Unraid API'})
export class RestartCommand extends CommandRunner {
	async run(_): Promise<void> {
		execSync(
			`${PM2_PATH} restart ${join(import.meta.dirname, '../../', 'ecosystem.config.json')} --update-env`,
			{
				env: process.env,
				stdio: 'inherit',
				cwd: process.cwd(),
			}
		);
	}
	
} 