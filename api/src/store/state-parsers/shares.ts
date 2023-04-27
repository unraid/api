
import { toNumberOrNull } from '@app/core/utils/casting';
import { type Share } from '@app/graphql/generated/api/types';
import type { StateFileToIniParserMap } from '@app/store/types';

export type SharesIni = Array<{
	name: string;
	free: string;
	used: string;
	size: string;
	include: string;
	exclude: string;
	useCache: string;
}>;

export const parse: StateFileToIniParserMap['shares'] = state => Object.values(state)
	.map((item) => {
		const { name, free, used, size, include, exclude, useCache, ...rest } = item;
		const share: Share = {
			name: name ?? '',
            free: toNumberOrNull(free),
			used: toNumberOrNull(used),
            size: toNumberOrNull(size),
            include: include.split(',').filter((_) => _),
            exclude: exclude.split(',').filter((_) => _),
            cache: useCache === 'yes',
            ...rest,
        };

		return share;
	});
