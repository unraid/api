import { CacheManager } from '@app/core/cache-manager';
import { FileMissingError } from '@app/core/errors/file-missing-error';
import { getters } from '@app/store';
import { readFile } from 'fs/promises';

const cache = new CacheManager('unraid:utils:misc/get-machine-id');

export const getMachineId = async (): Promise<string> => {
	const path = getters.paths()['machine-id'];
	let machineId: string = cache.get('machine-id');

	if (!path) {
		const error = new FileMissingError('/etc/machine-id');
		error.fatal = false;

		throw error;
	}

	if (!machineId) {
		machineId = await readFile(path, 'utf8').then(machineId => machineId.split('\n')[0].trim()).catch(() => '');
	}

	return machineId;
};
