import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getArrayData } from '@app/core/modules/array/get-array-data.js';
import { getParityCheckStatus, ParityCheckStatus } from '@app/core/modules/array/parity-check-status.js';
import { store } from '@app/store/index.js';
import { FileLoadStatus } from '@app/store/types.js';
import {
    ArrayDisk,
    ArrayDiskStatus,
    ArrayDiskType,
    ArrayState,
} from '@app/unraid-api/graph/resolvers/array/array.model.js';

vi.mock('@app/core/modules/array/parity-check-status.js', () => ({
    ParityCheckStatus: {
        NEVER_RUN: 'never_run',
    },
    getParityCheckStatus: vi.fn(),
}));

const buildDisk = (overrides: Partial<ArrayDisk> = {}): ArrayDisk => ({
    id: 'disk-id',
    idx: 1,
    type: ArrayDiskType.DATA,
    device: 'sda',
    comment: null,
    fsFree: 0,
    fsSize: 0,
    fsUsed: 0,
    ...overrides,
});

const buildGetState = (disks: ArrayDisk[]) => () =>
    ({
        emhttp: {
            status: FileLoadStatus.LOADED,
            var: {
                mdState: ArrayState.STOPPED,
                maxArraysz: 28,
            },
            disks,
        },
    }) as unknown as ReturnType<typeof store.getState>;

describe('getArrayData', () => {
    beforeEach(() => {
        vi.mocked(getParityCheckStatus).mockReturnValue({
            status: ParityCheckStatus.NEVER_RUN,
            speed: '0',
            date: undefined,
            duration: 0,
            progress: 0,
        });
    });

    it('prefers Boot slots from disks.ini over flash disks', () => {
        const result = getArrayData(
            buildGetState([
                buildDisk({
                    id: 'flash-disk',
                    idx: 32,
                    device: 'sdb',
                    type: ArrayDiskType.FLASH,
                }),
                buildDisk({
                    id: 'boot-disk',
                    idx: 54,
                    device: 'nvme0n1',
                    type: ArrayDiskType.BOOT,
                    status: ArrayDiskStatus.DISK_OK,
                }),
            ])
        );

        expect(result.boot?.id).toBe('boot-disk');
        expect(result.bootDevices.map((disk) => disk.id)).toEqual(['boot-disk']);
    });

    it('prefers the /boot-mounted Boot disk when multiple Boot disks exist', () => {
        const result = getArrayData(
            buildGetState([
                buildDisk({
                    id: 'boot-disk-secondary',
                    idx: 54,
                    device: 'nvme0n1',
                    type: ArrayDiskType.BOOT,
                    status: ArrayDiskStatus.DISK_OK,
                    fsMountpoint: null,
                }),
                buildDisk({
                    id: 'boot-disk-primary',
                    idx: 55,
                    device: 'nvme1n1',
                    type: ArrayDiskType.BOOT,
                    status: ArrayDiskStatus.DISK_OK,
                    fsMountpoint: '/boot',
                }),
            ])
        );

        expect(result.boot?.id).toBe('boot-disk-primary');
        expect(result.bootDevices.map((disk) => disk.id)).toEqual([
            'boot-disk-secondary',
            'boot-disk-primary',
        ]);
    });

    it('matches webgui and picks the first present Boot disk with a device', () => {
        const result = getArrayData(
            buildGetState([
                buildDisk({
                    id: 'boot-disk-missing',
                    idx: 54,
                    device: '',
                    type: ArrayDiskType.BOOT,
                    status: ArrayDiskStatus.DISK_NP,
                }),
                buildDisk({
                    id: 'boot-disk-online',
                    idx: 55,
                    device: 'nvme0n1',
                    type: ArrayDiskType.BOOT,
                    status: ArrayDiskStatus.DISK_OK,
                }),
            ])
        );

        expect(result.boot?.id).toBe('boot-disk-online');
    });

    it('falls back to a mounted Boot disk when no present Boot disk has a device', () => {
        const result = getArrayData(
            buildGetState([
                buildDisk({
                    id: 'boot-disk-mounted',
                    idx: 54,
                    device: '',
                    type: ArrayDiskType.BOOT,
                    status: ArrayDiskStatus.DISK_NP,
                    fsStatus: 'Mounted',
                    fsMountpoint: null,
                }),
                buildDisk({
                    id: 'boot-disk-unmounted',
                    idx: 55,
                    device: '',
                    type: ArrayDiskType.BOOT,
                    status: ArrayDiskStatus.DISK_NP_DSBL,
                    fsStatus: 'Unmounted',
                }),
            ])
        );

        expect(result.boot?.id).toBe('boot-disk-mounted');
    });

    it('falls back to flash when disks.ini has no Boot slots', () => {
        const result = getArrayData(
            buildGetState([
                buildDisk({
                    id: 'flash-disk',
                    idx: 32,
                    device: 'sdb',
                    type: ArrayDiskType.FLASH,
                    fsMountpoint: '/boot',
                }),
            ])
        );

        expect(result.boot?.id).toBe('flash-disk');
        expect(result.bootDevices.map((disk) => disk.id)).toEqual(['flash-disk']);
    });

    it('ignores non-mounted Flash rows when determining legacy USB boot devices', () => {
        const result = getArrayData(
            buildGetState([
                buildDisk({
                    id: 'flash-not-mounted',
                    idx: 32,
                    device: 'sdb',
                    type: ArrayDiskType.FLASH,
                    fsMountpoint: null,
                }),
                buildDisk({
                    id: 'flash-mounted',
                    idx: 33,
                    device: 'sdc',
                    type: ArrayDiskType.FLASH,
                    fsMountpoint: '/boot',
                }),
            ])
        );

        expect(result.boot?.id).toBe('flash-mounted');
        expect(result.bootDevices.map((disk) => disk.id)).toEqual(['flash-mounted']);
    });
});
