/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import mm from 'micromongo';
import { paths } from '../paths';
import { Slot } from '../types/states';
import { LooseObject, IniNumberBoolean, IniEnabled } from '../types';
import { toBoolean, toNumber } from '../utils/casting';
import { parseConfig } from '../utils/misc';
import { ArrayState } from './state';

type SlotStatus = 'DISK_OK';
type SlotFsStatus = 'Mounted';
type SlotFsType = 'vfat' | 'ntfs';
type SlotType = 'Flash';
type SlotColor = 'green-on';

interface SlotIni {
	color: SlotColor;
	comment: string;
	device: string;
	exportable: IniEnabled;
	format: string;
	fsColor: string;
	fsFree: string;
	fsSize: string;
	fsStatus: SlotFsStatus;
	fsType: SlotFsType;
	id: string;
	idx: string;
	luksState: string;
	name: string;
	numErrors: string;
	numReads: string;
	numWrites: string;
	rotational: IniNumberBoolean;
	size: string;
	sizeSb: string;
	slot: string;
	status: SlotStatus;
	temp: string;
	type: SlotType;
}

const parse = (state: SlotIni[]) => {
	return Object.values(state).map(slot => {
		const result = {
			...slot,
			size: toNumber(slot.size),
			rotational: toBoolean(slot.rotational),
			temp: toNumber(slot.temp),
			numReads: toNumber(slot.numReads),
			numWrites: toNumber(slot.numWrites),
			numErrors: toNumber(slot.numErrors),
			sizeSb: toNumber(slot.sizeSb),
			fsSize: toNumber(slot.fsSize),
			fsFree: toNumber(slot.fsFree),
			exportable: slot.exportable === 'e',
			fsColor: slot.fsColor && slot.fsColor.replace('-', '_')
		};

		return result;
	}).filter(disk => disk.id);
};

/**
 * Slots
 */
class Slots extends ArrayState {
	public channel = 'slots';
	private static instance: Slots;

	constructor() {
		super();

		if (Slots.instance) {
			return Slots.instance;
		}

		Slots.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.get('states')!;
			const statePath = path.join(statesDirectory, 'disks.ini');
			const state = parseConfig<SlotIni[]>({
				filePath: statePath,
				type: 'ini'
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state) {
		const data = parse(state);

		// Update local data
		this.set(data);

		// Update slots channel with new slots
		this.emit('UPDATED', data);

		return data;
	}

	find(query?: LooseObject): Slot[] {
		return super.find(query);
	}

	findOne(query: LooseObject = {}): Slot {
		return mm.findOne(this.data, query);
	}
}

export const slotsState = new Slots();
