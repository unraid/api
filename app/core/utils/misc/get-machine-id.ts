import fs from 'fs';
import { paths } from '../../paths';
import { CacheManager } from '../../cache-manager';
import { FileMissingError } from '../../errors';

const cache = new CacheManager('unraid:utils:misc/get-machine-id');

export const getMachineId = async () => {
	const path = paths.get('machine-id');
	let machineId = cache.get('machine-id');

	if (!path) {
		const error = new FileMissingError('/etc/machine-id');
		error.fatal = true;

		throw error;
	}

	if (!machineId) {
		machineId = await fs.promises.readFile(path, 'utf8').then(machineId => machineId.split('\n')[0].trim());
	}

	return machineId;
};
