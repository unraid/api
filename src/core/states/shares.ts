/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import mm from 'micromongo';
import { paths } from '@app/core/paths';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { ArrayState } from '@app/core/states/state';
import { LooseObject } from '@app/core/types';
import { Share } from '@app/core/types/states';

interface SharesIni {
	name: string;
	free: string;
	size: string;
	include: string;
	exclude: string;
	useCache: string;
}

const parse = (state: SharesIni[]): Share[] => {
	return Object.entries(state)
		.map(([_, item]) => {
			const { free, size, include, exclude, useCache, ...rest } = item;
			const share: Share = {
				free: parseInt(free, 10),
				size: parseInt(size, 10),
				include: include.split(',').filter(_ => _),
				exclude: exclude.split(',').filter(_ => _),
				cache: useCache === 'yes',
				...rest
			};

			return share;
		});
};

export class Shares extends ArrayState {
	private static instance: Shares;
	public channel = 'shares';

	constructor() {
		super();

		if (Shares.instance) {
			// eslint-disable-next-line no-constructor-return
			return Shares.instance;
		}

		Shares.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.states;
			const statePath = path.join(statesDirectory, 'shares.ini');
			const state = parseConfig<SharesIni[]>({
				filePath: statePath,
				type: 'ini'
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state: SharesIni[]) {
		const data = parse(state);
		this.set(data);
		return data;
	}

	find(query?: LooseObject): Share[] {
		return super.find(query);
	}

	findOne(query: LooseObject = {}): Share {
		return mm.findOne(this.data, query);
	}
}

export const sharesState = new Shares();
