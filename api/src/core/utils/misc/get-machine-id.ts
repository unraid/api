import { FileMissingError } from '@app/core/errors/file-missing-error';
import { getters } from '@app/store';
import { readFile } from 'fs/promises';

let machineId: string | null = null

export const getMachineId = async (): Promise<string> => {
	const path = getters.paths()['machine-id'];

	if (machineId) {
		return machineId;
	}

	if (!path) {
		const error = new FileMissingError('/etc/machine-id');
		error.fatal = false;

		throw error;
	}
	machineId = await readFile(path, 'utf8').then(machineId => machineId.split('\n')[0].trim()).catch(() => '');
	return machineId;

};
