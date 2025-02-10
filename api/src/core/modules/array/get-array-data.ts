import { GraphQLError } from 'graphql';
import { sum } from 'lodash-es';

import type { ArrayCapacity, ArrayType } from '@app/graphql/generated/api/types';
import { getServerIdentifier } from '@app/core/utils/server-identifier';
import { ArrayDiskType } from '@app/graphql/generated/api/types';
import { store } from '@app/store/index';
import { FileLoadStatus } from '@app/store/types';

export const getArrayData = (getState = store.getState): ArrayType => {
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
    const allDisks = emhttp.disks.filter((disk) => disk.device);

    // Array boot/parities/disks/caches
    const boot = allDisks.find((disk) => disk.type === ArrayDiskType.FLASH);
    const parities = allDisks.filter((disk) => disk.type === ArrayDiskType.PARITY);
    const disks = allDisks.filter((disk) => disk.type === ArrayDiskType.DATA);
    const caches = allDisks.filter((disk) => disk.type === ArrayDiskType.CACHE);
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
        id: getServerIdentifier('array'),
        state: emhttp.var.mdState,
        capacity,
        boot,
        parities,
        disks,
        caches,
    };
};
