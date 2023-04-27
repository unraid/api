import { type IniEnabled, type IniNumberBoolean } from '@app/core/types/ini';
import {
    toNumber,
    toBoolean,
    toNumberOrNull,
} from '@app/core/utils';
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
    slots: string;
    status: SlotStatus;
    temp: string;
    type: SlotType;
    warning: string;
    critical: string;
    transport: string;
};

export type SlotsIni = IniSlot[];

export const parse: StateFileToIniParserMap['disks'] = (disksIni) =>
    Object.values(disksIni)
        .filter((slot) => slot.id)
        .map((slot) => {
            const result: ArrayDisk = {
                id: slot.id,
                device: slot.device,
                comment: slot.comment ?? null,
                exportable: toBoolean(slot.exportable),
                fsFree: toNumberOrNull(slot.fsFree),
                fsUsed: toNumberOrNull(slot.fsUsed),
                fsSize: toNumberOrNull(slot.fsSize),
                idx: toNumber(slot.idx),
                name: slot.name,
                numErrors: toNumber(slot.numErrors),
                numReads: 0,
                numWrites: 0,
                rotational: toBoolean(slot.rotational),
                size: toNumber(slot.size),
                status: ArrayDiskStatus[slot.status],
                temp: toNumberOrNull(slot.temp),
                type: slot.type
                    ? ArrayDiskType[slot.type.toUpperCase()]
                    : undefined,
                warning: toNumberOrNull(slot.warning),
                critical: toNumberOrNull(slot.critical),
                fsType: slot.fsType ?? null,
                format: slot.format === '-' ? null: slot.format,
                transport: slot.transport ?? null
            };
            // @TODO Zod Parse This
            return result;
        });
