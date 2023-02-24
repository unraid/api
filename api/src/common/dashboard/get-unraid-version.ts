import { getters } from '@app/store';
import { FileLoadStatus } from '@app/store/types';

/**
 * Unraid version string.
 * @returns The current version.
 */
export const getUnraidVersion = async (): Promise<string> => {
	const { status, var: emhttpVar } = getters.emhttp();
	if (status === FileLoadStatus.LOADED) {
		return emhttpVar.version;
	}

	return 'unknown';
};
