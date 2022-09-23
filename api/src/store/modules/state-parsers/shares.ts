import { Share, Shares } from '@app/core/types/states/share';

type SharesIni = {
	name: string;
	free: string;
	size: string;
	include: string;
	exclude: string;
	useCache: string;
};

export const parse = (state: SharesIni[]): Shares => Object.entries(state)
	.map(([_, item]) => {
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
