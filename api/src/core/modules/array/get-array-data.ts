import { logger } from '@app/core/log';
import {
    ArrayDiskType,
    type ArrayCapacity,
    type ArrayType,
} from '@app/graphql/generated/api/types';
import { store } from '@app/store/index';
import { FileLoadStatus } from '@app/store/types';
import sum from 'lodash/sum';

export const getArrayData = (getState = store.getState): ArrayType | null => {
    // Var state isn't loaded
    const state = getState();
    if (
        !state ||
        state.emhttp.status !== FileLoadStatus.LOADED ||
        Object.keys(state.emhttp.var).length === 0
    ) {
        logger.error('Attempt to get Array Data, but state was not loaded');
        return null;
    }

    const { emhttp } = state;

    // All known disks
    const allDisks = emhttp.disks.filter((disk) => disk.device);

    // Array boot/parities/disks/caches
    const boot = allDisks.find((disk) => disk.type === ArrayDiskType.FLASH);
    const parities = allDisks.filter(
        (disk) => disk.type === ArrayDiskType.PARITY
    );
    const disks = allDisks.filter((disk) => disk.type === ArrayDiskType.DATA);
    const caches = allDisks.filter(
        (disk) => disk.type === ArrayDiskType.PARITY
    );

    // Disk sizes
    const disksTotalKBytes = sum(disks.map((disk) => disk.fsSize));
    const disksFreeKBytes = sum(disks.map((disk) => disk.fsFree));
    const disksUsedKByes = sum(disks.map((disk) => disk.fsUsed));

    // Max
    const maxDisks = emhttp.var.maxArraysz ?? disks.length;

    // Array capacity
    const capacity: ArrayCapacity = {
        kilobytes: {
            free: disksFreeKBytes.toString(),
            used: disksUsedKByes.toString(),
            total: disksTotalKBytes.toString(),
        },
        disks: {
            free: String(maxDisks - disks.length),
            used: String(disks.length),
            total: String(maxDisks),
        },
    };

    return {
        state: emhttp.var.mdState,
        capacity,
        boot,
        parities,
        disks,
        caches,
    };
};
