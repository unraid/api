import { SecIni } from '@app/core/types/states/sec';

/**
 * Array of NFS shares.
 */
export const parse = (state: SecIni[]) => Object.entries(state).map(([_name, item]) => {
	const { export: enabled, writeList, readList, ...rest } = item;

	return {
		enabled: enabled === 'e',
		writeList: writeList ? writeList.split(',') : [],
		readList: readList ? readList.split(',') : [],
		...rest,
	};
});
