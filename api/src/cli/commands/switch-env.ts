import { copyFile, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { cliLogger } from '@app/core/log';
import { getUnraidApiPid } from '@app/cli/get-unraid-api-pid';
import { setEnv } from '@app/cli/set-env';
import { stop } from '@app/cli/commands/stop';
import { getters } from '@app/store';

export const switchEnv = async () => {
	setEnv('LOG_TYPE', 'raw');

	const paths = getters.paths();
	const basePath = paths['unraid-api-base'];
	const envFlashFilePath = paths['myservers-env'];
	const envFile = await readFile(envFlashFilePath, 'utf-8').catch(() => '');

	cliLogger.debug('Checking %s for current ENV, found %s', envFlashFilePath, envFile);

	// Match the env file env="production" which would be [0] = env="production", [1] = env and [2] = production
	const matchArray = /([a-zA-Z]+)=["]*([a-zA-Z]+)["]*/.exec(envFile);
	// Get item from index 2 of the regex match or return undefined
	const [,,currentEnvInFile] = matchArray && matchArray.length === 3 ? matchArray : [];

	let newEnv = 'production';

	// Switch from staging to production
	if (currentEnvInFile === 'staging') {
		newEnv = 'production';
	}

	// Switch from production to staging
	if (currentEnvInFile === 'production') {
		newEnv = 'staging';
	}

	if (currentEnvInFile) {
		cliLogger.debug('Switching from "%s" to "%s"...', currentEnvInFile, newEnv);
	} else {
		cliLogger.debug('No ENV found, setting env to "production"...');
	}

	// Write new env to flash
	const newEnvLine = `env="${newEnv}"`;
	await writeFile(envFlashFilePath, newEnvLine);
	cliLogger.debug('Writing %s to %s', newEnvLine, envFlashFilePath);

	// Copy the new env over to live location before restarting
	const source = join(basePath, `.env.${newEnv}`);
	const destination = join(basePath, '.env');

	cliLogger.debug('Copying %s to %s', source, destination);
	await copyFile(source, destination);
	// If there's a process running restart it
	const unraidApiPid = await getUnraidApiPid();
	if (unraidApiPid) {
		cliLogger.debug('unraid-api is running, stopping...');
		// Stop running process
		await stop();
	}

	cliLogger.info('Now using %s', newEnv);
	cliLogger.info('Run "unraid-api start" to start the API.');
};
