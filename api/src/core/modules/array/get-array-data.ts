import { GraphQLError } from 'graphql';
import { sum } from 'lodash-es';

import { getParityCheckStatus } from '@app/core/modules/array/parity-check-status.js';
import { store } from '@app/store/index.js';
import { FileLoadStatus } from '@app/store/types.js';
import {
    ArrayCapacity,
    ArrayDisk,
    ArrayDiskStatus,
    ArrayDiskType,
    ArrayState,
    UnraidArray,
} from '@app/unraid-api/graph/resolvers/array/array.model.js';

const selectBootDisk = (bootDisks: ArrayDisk[]): ArrayDisk | undefined => {
    if (bootDisks.length === 0) {
        return undefined;
    }

    for (const disk of bootDisks) {
        if (disk.status === ArrayDiskStatus.DISK_NP_DSBL || disk.status === ArrayDiskStatus.DISK_NP) {
            continue;
        }
        if (!disk.device) {
            continue;
        }
        return disk;
    }

    for (const disk of bootDisks) {
        if (disk.fsStatus === 'Mounted') {
            return disk;
        }
    }

    return bootDisks[0];
};

export const getArrayData = (getState = store.getState): UnraidArray => {
    // Var state isn't loaded
    const state = getState();
    if (
        !state ||
        state.emhttp.status !== FileLoadStatus.LOADED ||
        Object.keys(state.emhttp.var).length === 0
    ) {
        throw new GraphQLError('Attempt to get Array Data, but state was not loaded');
    }

    const { emhttp } = state;

    // All known disks
    const allDisks = emhttp.disks;
    const disksWithDevice = allDisks.filter((disk) => disk.device);
    const bootDisks = allDisks.filter((disk) => disk.type === ArrayDiskType.BOOT);

    // Array boot/parities/disks/caches
    const boot =
        selectBootDisk(bootDisks) ?? disksWithDevice.find((disk) => disk.type === ArrayDiskType.FLASH);
    const parities = disksWithDevice.filter((disk) => disk.type === ArrayDiskType.PARITY);
    const disks = disksWithDevice.filter((disk) => disk.type === ArrayDiskType.DATA);
    const caches = disksWithDevice.filter((disk) => disk.type === ArrayDiskType.CACHE);
    // Disk sizes
    const disksTotalKBytes = sum(disks.map((disk) => disk.fsSize));
    const disksFreeKBytes = sum(disks.map((disk) => disk.fsFree));
    const disksUsedKBytes = sum(disks.map((disk) => disk.fsUsed));

    // Max
    const maxDisks = emhttp.var.maxArraysz ?? disks.length;

    // Array capacity
    const capacity: ArrayCapacity = {
        kilobytes: {
            free: disksFreeKBytes.toString(),
            used: disksUsedKBytes.toString(),
            total: disksTotalKBytes.toString(),
        },
        disks: {
            free: String(maxDisks - disks.length),
            used: String(disks.length),
            total: String(maxDisks),
        },
    };

    return {
        id: 'array',
        state: emhttp.var.mdState as ArrayState,
        capacity,
        boot,
        parities,
        disks,
        caches,
        parityCheckStatus: getParityCheckStatus(emhttp.var),
    };
};
