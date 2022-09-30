import { IniEnabled, IniNumberBoolean } from '@app/core/types';
import { toNumber, toBoolean } from '@app/core/utils';

type SlotStatus = 'DISK_OK';
type SlotFsStatus = 'Mounted';
type SlotFsType = 'vfat' | 'ntfs';
type SlotType = 'Flash';
type SlotColor = 'green-on';

type SlotIni = {
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
};

export const parse = (state: SlotIni[]) => Object.values(state).map(slot => {
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
		fsColor: slot.fsColor?.replace('-', '_'),
	};

	return result;
}).filter(disk => disk.id);
