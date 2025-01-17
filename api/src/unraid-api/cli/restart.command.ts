import { execSync } from 'child_process';
import { join } from 'path';



import { Command, CommandRunner } from 'nest-commander';



import { ECOSYSTEM_PATH, PM2_PATH } from '@app/consts';





/**
 * Stop a running API process and then start it again.
 */
@Command({ name: 'restart', description: 'Restart / Start the Unraid API'})
export class RestartCommand extends CommandRunner {
	async run(_): Promise<void> {
		console.log(
            'Dirname is ',
            import.meta.dirname,
            ' command is ',
            `${PM2_PATH} restart ${ECOSYSTEM_PATH} --update-env`
        );
		execSync(
			`${PM2_PATH} restart ${ECOSYSTEM_PATH} --update-env`,
			{
				env: process.env,
				stdio: 'pipe',
				cwd: process.cwd(),
			}
		);
	}
	
}