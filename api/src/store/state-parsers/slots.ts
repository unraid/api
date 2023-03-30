import { type IniEnabled, type IniNumberBoolean } from '@app/core/types/ini';
import { toNumber, toBoolean } from '@app/core/utils';
import {
    ArrayDiskStatus,
    ArrayDiskType,
    type ArrayDisk,
} from '@app/graphql/generated/api/types';
import type { StateFileToIniParserMap } from '@app/store/types';

type SlotStatus = 'DISK_OK';
type SlotFsStatus = 'Mounted';
type SlotFsType = 'vfat' | 'ntfs';
type SlotType = 'Flash' | 'Cache' | 'Array' | 'Parity';
type SlotColor = 'green-on';

export type IniSlot = {
    color: SlotColor;
    comment: string;
    device: string;
    exportable: IniEnabled;
    format: string;
    fsColor: string;
    fsFree: string;
    fsUsed: string;
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

export type SlotsIni = IniSlot[];

export const parse: StateFileToIniParserMap['disks'] = (disksIni) =>
    Object.values(disksIni)
        .filter((slot) => slot.id)
        .map((slot) => {
            const result: ArrayDisk = {
                id: slot.id,
                device: slot.device,
                exportable: toBoolean(slot.exportable),
                fsFree: toNumber(slot.fsFree),
                fsUsed: toNumber(slot.fsUsed),
                fsSize: toNumber(slot.fsSize),
                idx: toNumber(slot.idx),
                name: slot.name,
                numErrors: toNumber(slot.numErrors),
                numReads: toNumber(slot.numReads),
                numWrites: toNumber(slot.numWrites),
                rotational: toBoolean(slot.rotational),
                size: toNumber(slot.size),
                status: ArrayDiskStatus[slot.status],
                temp: toNumber(slot.temp),
                type: slot.type
                    ? ArrayDiskType[slot.type.toUpperCase()]
                    : undefined,
            };
            // @TODO Zod Parse This
            return result;
        });
