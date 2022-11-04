import { SecIni } from '@app/core/types/states/sec';

export type NfsSharesIni = SecIni[];

/**
 * Array of NFS shares.
 */
export const parse = (state: NfsSharesIni) => Object.entries(state).map(([name, item]) => {
	const { export: enabled, writeList, readList, ...rest } = item;

	return {
		name,
		enabled: enabled === 'e',
		writeList: writeList ? writeList.split(',') : [],
		readList: readList ? readList.split(',') : [],
		...rest,
	};
});
