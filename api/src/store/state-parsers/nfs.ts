import type { SecIni } from '@app/core/types/states/sec';
import type { StateFileToIniParserMap } from '@app/store/types';

export type NfsSharesIni = SecIni[];

/**
 * Array of NFS shares.
 */
export const parse: StateFileToIniParserMap['sec_nfs'] = state => Object.entries(state).map(([name, item]) => {
	const { export: enabled, writeList, readList, ...rest } = item;

	return {
		name,
		enabled: enabled === 'e',
		writeList: writeList ? writeList.split(',') : [],
		readList: readList ? readList.split(',') : [],
		...rest,
	};
});
