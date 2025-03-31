import { BadRequestException, Injectable } from '@nestjs/common';

import { capitalCase, constantCase } from 'change-case';

import type { ArrayDiskInput, ArrayStateInput, ArrayType } from '@app/graphql/generated/api/types.js';
import { AppError } from '@app/core/errors/app-error.js';
import { ArrayRunningError } from '@app/core/errors/array-running-error.js';
import { getArrayData } from '@app/core/modules/array/get-array-data.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import {
    ArrayPendingState,
    ArrayState,
    ArrayStateInputState,
} from '@app/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';
import { arrayIsRunning as arrayIsRunningUtil } from '@app/core/utils/index.js';

@Injectable()
export class ArrayService {
    private pendingState: ArrayPendingState | null = null;

    /**
     * Is the array running?
     * @todo Refactor this to include this util in the service directly
     */
    private arrayIsRunning() {
        return arrayIsRunningUtil();
    }

    async updateArrayState({ desiredState }: ArrayStateInput): Promise<ArrayType> {
        const startState = this.arrayIsRunning() ? ArrayState.STARTED : ArrayState.STOPPED;
        const pendingState =
            desiredState === ArrayStateInputState.STOP
                ? ArrayPendingState.STOPPING
                : ArrayPendingState.STARTING;

        // Prevent this running multiple times at once
        if (this.pendingState) {
            throw new BadRequestException(
                new AppError(`Array state is still being updated. Changing to ${pendingState}`)
            );
        }

        // Prevent starting/stopping array when it's already in the same state
        if (
            (this.arrayIsRunning() && desiredState === ArrayStateInputState.START) ||
            (!this.arrayIsRunning() && desiredState === ArrayStateInputState.STOP)
        ) {
            throw new BadRequestException(new AppError(`The array is already ${startState}`));
        }

        // Set lock then start/stop array
        this.pendingState = pendingState;
        const command = {
            [`cmd${capitalCase(desiredState)}`]: capitalCase(desiredState),
            startState: constantCase(startState),
        };

        try {
            await emcmd(command);
        } finally {
            this.pendingState = null;
        }

        // Get new array JSON
        const array = getArrayData();

        return array;
    }

    async addDiskToArray(input: ArrayDiskInput): Promise<ArrayType> {
        if (this.arrayIsRunning()) {
            throw new ArrayRunningError();
        }

        const { id: diskId, slot: preferredSlot } = input;
        const slot = preferredSlot?.toString() ?? '';

        // Add disk
        await emcmd({
            changeDevice: 'apply',
            [`slotId.${slot}`]: diskId,
        });

        return getArrayData();
    }

    async removeDiskFromArray(input: ArrayDiskInput): Promise<ArrayType> {
        if (this.arrayIsRunning()) {
            throw new ArrayRunningError();
        }

        const { slot } = input;
        const slotStr = slot?.toString() ?? '';

        // Remove disk
        await emcmd({
            changeDevice: 'apply',
            [`slotId.${slotStr}`]: '',
        });

        return getArrayData();
    }

    async mountArrayDisk(id: string): Promise<any> {
        if (!this.arrayIsRunning()) {
            throw new BadRequestException('Array must be running to mount disks');
        }

        // Mount disk
        await emcmd({
            mount: 'apply',
            [`diskId.${id}`]: '1',
        });

        return getArrayData();
    }

    async unmountArrayDisk(id: string): Promise<any> {
        if (!this.arrayIsRunning()) {
            throw new BadRequestException('Array must be running to unmount disks');
        }

        // Unmount disk
        await emcmd({
            unmount: 'apply',
            [`diskId.${id}`]: '1',
        });

        return getArrayData();
    }

    async clearArrayDiskStatistics(id: string): Promise<any> {
        if (!this.arrayIsRunning()) {
            throw new BadRequestException('Array must be running to clear disk statistics');
        }

        // Clear disk statistics
        await emcmd({
            clearStats: 'apply',
            [`diskId.${id}`]: '1',
        });

        return getArrayData();
    }
}
