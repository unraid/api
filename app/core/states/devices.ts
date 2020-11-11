/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import mm from 'micromongo';
import { paths } from '../paths';
import { parseConfig } from '../utils/misc';
import { ArrayState } from './state';
import { LooseObject } from '../types';

interface Device {}
interface DeviceIni {}

const parse = (state: DeviceIni[]): Device[] => Object.values(state);

/**
 * Devices
 */
class Devices extends ArrayState {
	private static instance: Devices;
	_data: any;

	constructor() {
		super();

		if (Devices.instance) {
			return Devices.instance;
		}

		Devices.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.get('states')!;
			const statePath = path.join(statesDirectory, 'devs.ini');
			const state = parseConfig<any[]>({
				filePath: statePath,
				type: 'ini'
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
