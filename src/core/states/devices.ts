/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import mm from 'micromongo';
import { ArrayState } from '@app/core/states/state';
import { LooseObject } from '@app/core/types';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { getters } from '@app/store';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Device {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DeviceIni {}

const parse = (state: DeviceIni[]): Device[] => Object.values(state);

/**
 * Devices
 */
export class Devices extends ArrayState {
	private static instance: Devices;
	public channel = 'devices';
	_data: any;

	constructor() {
		super();

		if (Devices.instance) {
			// eslint-disable-next-line no-constructor-return
			return Devices.instance;
		}

		Devices.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = getters.paths().states;
			const statePath = path.join(statesDirectory, 'devs.ini');
			const state = parseConfig<any[]>({
				filePath: statePath,
				type: 'ini',
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state) {
		const devices = parse(state);

		// Update local data
		this.set(devices);

		return devices;
	}

	find(query?: LooseObject): Device[] {
		return super.find(query);
	}

	findOne(query: LooseObject = {}): Device {
		return mm.findOne(this.data, query);
	}
}

export const devicesState = new Devices();
