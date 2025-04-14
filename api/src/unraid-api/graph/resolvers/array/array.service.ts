import { BadRequestException, Injectable } from '@nestjs/common';

import { capitalCase, constantCase } from 'change-case';
import { GraphQLError } from 'graphql';

import { AppError } from '@app/core/errors/app-error.js';
import { ArrayRunningError } from '@app/core/errors/array-running-error.js';
import { getArrayData as getArrayDataUtil } from '@app/core/modules/array/get-array-data.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import {
    ArrayDiskInput,
    ArrayState,
    ArrayStateInput,
    ArrayStateInputState,
    UnraidArray,
} from '@app/unraid-api/graph/resolvers/array/array.model.js';

enum ArrayPendingState {
    STARTING = 'STARTING',
    STOPPING = 'STOPPING',
}

@Injectable()
export class ArrayService {
    private pendingState: ArrayPendingState | null = null;

    /**
     * Is the array running?
     * @todo Refactor this to include this util in the service directly
     */
    private arrayIsRunning = async () => {
        const { getters } = await import('@app/store/index.js');
        const emhttp = getters.emhttp();
        return emhttp.var.mdState === ArrayState.STARTED;
    };

    private getArrayState = async () => {
        const { getters } = await import('@app/store/index.js');
        const emhttp = getters.emhttp();
        return emhttp.var.mdState;
    };

    public async getArrayData(): Promise<UnraidArray> {
        const { store } = await import('@app/store/index.js');
        return getArrayDataUtil(store.getState);
    }

    async updateArrayState({ desiredState }: ArrayStateInput): Promise<UnraidArray> {
        if (this.pendingState) {
            throw new BadRequestException(
                new AppError(`Array state is still being updated. Changing to ${this.pendingState}`)
            );
        }
        const isRunning = await this.arrayIsRunning();
        const startState = isRunning ? ArrayState.STARTED : ArrayState.STOPPED;
        const newPendingState =
            desiredState === ArrayStateInputState.STOP
                ? ArrayPendingState.STOPPING
                : ArrayPendingState.STARTING;

        // Prevent starting/stopping array when it's already in the same state

        if (
            (isRunning && desiredState === ArrayStateInputState.START) ||
            (!isRunning && desiredState === ArrayStateInputState.STOP)
        ) {
            throw new BadRequestException(new AppError(`The array is already ${startState}`));
        }

        // Set lock then start/stop array
        this.pendingState = newPendingState;
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
        const array = this.getArrayData();

        return array;
    }

    async addDiskToArray(input: ArrayDiskInput): Promise<UnraidArray> {
        if (await this.arrayIsRunning()) {
            throw new ArrayRunningError();
        }

        const { id: diskId, slot: preferredSlot } = input;
        const slot = preferredSlot?.toString() ?? '';

        // Add disk
        await emcmd({
            changeDevice: 'apply',
            [`slotId.${slot}`]: diskId,
        });

        return this.getArrayData();
    }

    async removeDiskFromArray(input: ArrayDiskInput): Promise<UnraidArray> {
        if (await this.arrayIsRunning()) {
            throw new ArrayRunningError();
        }

        const { slot } = input;
        const slotStr = slot?.toString() ?? '';

        // Remove disk
        await emcmd({
            changeDevice: 'apply',
            [`slotId.${slotStr}`]: '',
        });

        return this.getArrayData();
    }

    async mountArrayDisk(id: string): Promise<UnraidArray> {
        if (!(await this.arrayIsRunning())) {
            throw new BadRequestException('Array must be running to mount disks');
        }

        // Mount disk
        await emcmd({
            mount: 'apply',
            [`diskId.${id}`]: '1',
        });

        return this.getArrayData();
    }

    async unmountArrayDisk(id: string): Promise<UnraidArray> {
        if (!(await this.arrayIsRunning())) {
            throw new BadRequestException('Array must be running to unmount disks');
        }

        // Unmount disk
        await emcmd({
            unmount: 'apply',
            [`diskId.${id}`]: '1',
        });

        return this.getArrayData();
    }

    async clearArrayDiskStatistics(id: string): Promise<UnraidArray> {
        if (!(await this.arrayIsRunning())) {
            throw new BadRequestException('Array must be running to clear disk statistics');
        }

        // Clear disk statistics
        await emcmd({
            clearStats: 'apply',
            [`diskId.${id}`]: '1',
        });

        return this.getArrayData();
    }
}
