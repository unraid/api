import fs from 'fs';
import { paths } from '../../paths';
import { CacheManager } from '../../cache-manager';
import { FileMissingError } from '../../errors';

const cache = new CacheManager('unraid:utils:misc/get-machine-id');

export const getMachineId = async (): Promise<string> => {
	const path = paths['machine-id'];
	let machineId: string = cache.get('machine-id');

	if (!path) {
		const error = new FileMissingError('/etc/machine-id');
		error.fatal = false;

		throw error;
	}

	if (!machineId) {
		machineId = await fs.promises.readFile(path, 'utf8').then(machineId => machineId.split('\n')[0].trim()).catch(() => '');
	}

	return machineId;
};
