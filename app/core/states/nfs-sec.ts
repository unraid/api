/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import { paths } from '../paths';
import { ArrayState } from './state';
import { parseConfig } from '../utils/misc';
import { SecIni } from '../types/states';
import { LooseObject } from '../types';

/**
 * Array of NFS shares.
 */
const parse = (state: SecIni[]) => {
	return Object.entries(state).map(([_name, item]) => {
		const { export: enabled, writeList, readList, ...rest } = item;

		return {
			enabled: enabled === 'e',
			writeList: writeList ? writeList.split(',') : [],
			readList: readList ? readList.split(',') : [],
			...rest
		};
	});
};

class NfsSec extends ArrayState {
	public channel = 'nsf-sec';
	private static instance: NfsSec;

	constructor() {
		super();

		if (NfsSec.instance) {
			return NfsSec.instance;
		}

		NfsSec.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.get('states')!;
			const statePath = path.join(statesDirectory, 'sec_nfs.ini');
			const state = parseConfig<SecIni[]>({
				filePath: statePath,
				type: 'ini'
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
