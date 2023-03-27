import type { Share } from '@app/core/types/states/share';
import type { StateFileToIniParserMap } from '@app/store/types';

export type SharesIni = Array<{
	name: string;
	free: string;
	size: string;
	include: string;
	exclude: string;
	useCache: string;
}>;

export const parse: StateFileToIniParserMap['shares'] = state => Object.values(state)
	.map((item) => {
		const { free, size, include, exclude, useCache, ...rest } = item;
		const share: Share = {
			free: parseInt(free, 10),
			size: parseInt(size, 10),
			include: include.split(',').filter(_ => _),
			exclude: exclude.split(',').filter(_ => _),
			cache: useCache === 'yes',
			...rest,
		};

		return share;
	});
