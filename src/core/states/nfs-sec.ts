/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import { paths } from '@app/core/paths';
import { ArrayState } from '@app/core/states/state';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { SecIni } from '@app/core/types/states/sec';
import { LooseObject } from '@app/core/types';

/**
 * Array of NFS shares.
 */
const parse = (state: SecIni[]) => Object.entries(state).map(([_name, item]) => {
	const { export: enabled, writeList, readList, ...rest } = item;

	return {
		enabled: enabled === 'e',
		writeList: writeList ? writeList.split(',') : [],
		readList: readList ? readList.split(',') : [],
		...rest,
	};
});

export class NfsSec extends ArrayState {
	private static instance: NfsSec;
	public channel = 'nsf-sec';

	constructor() {
		super();

		if (NfsSec.instance) {
			// eslint-disable-next-line no-constructor-return
			return NfsSec.instance;
		}

		NfsSec.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.states;
			const statePath = path.join(statesDirectory, 'sec_nfs.ini');
			const state = parseConfig<SecIni[]>({
				filePath: statePath,
				type: 'ini',
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state: SecIni[]) {
		const data = parse(state);
		this.set(data);
		return data;
	}

	find(query?: LooseObject): SecIni[] {
		return super.find(query);
	}
}

export const nfsSecState = new NfsSec();
