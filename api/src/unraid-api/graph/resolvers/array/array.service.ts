import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

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

    private invalidDecryptionKeyfileError = () =>
        new BadRequestException(
            new AppError('Decryption keyfile must be a valid data URL or raw base64 payload.')
        );

    private encodeDecryptionPassword = (decryptionPassword: string) => {
        const printableAscii = /^[ -~]+$/;

        if (!printableAscii.test(decryptionPassword)) {
            throw new BadRequestException(
                new AppError(
                    'Decryption password must use printable ASCII characters. Use a keyfile for UTF-8 input.'
                )
            );
        }

        return Buffer.from(decryptionPassword, 'utf8').toString('base64');
    };

    private decodeDecryptionKeyfile = (decryptionKeyfile: string): Buffer => {
        const source = decryptionKeyfile.trim();
        const dataUrlMatch = /^data:[^,]*,(.+)$/i.exec(source);

        if (dataUrlMatch) {
            const meta = source.slice(5, source.indexOf(','));
            const payload = dataUrlMatch[1];

            try {
                return /;base64/i.test(meta)
                    ? this.decodeStrictBase64(payload)
                    : Buffer.from(decodeURIComponent(payload), 'utf8');
            } catch {
                throw this.invalidDecryptionKeyfileError();
            }
        }

        return this.decodeStrictBase64(source);
    };

    private decodeStrictBase64 = (payload: string): Buffer => {
        const normalized = payload.replace(/\s+/g, '');
        if (
            normalized.length === 0 ||
            normalized.length % 4 !== 0 ||
            !/^[A-Za-z0-9+/=]+$/.test(normalized)
        ) {
            throw this.invalidDecryptionKeyfileError();
        }

        try {
            const decoded = Buffer.from(normalized, 'base64');
            if (!decoded.length) {
                throw new Error('empty');
            }
            const normalizedInput = normalized.replace(/=+$/g, '');
            const normalizedDecoded = decoded.toString('base64').replace(/=+$/g, '');
            if (normalizedInput !== normalizedDecoded) {
                throw new Error('mismatch');
            }
            return decoded;
        } catch {
            throw this.invalidDecryptionKeyfileError();
        }
    };

    private writeDecryptionKeyfile = async (decryptionKeyfile: string) => {
        const { getters } = await import('@app/store/index.js');
        const luksKeyfile = getters.emhttp().var?.luksKeyfile;

        if (!luksKeyfile) {
            throw new BadRequestException(
                new AppError('Array decryption keyfile path is not configured.')
            );
        }

        await mkdir(dirname(luksKeyfile), { recursive: true });
        await writeFile(luksKeyfile, this.decodeDecryptionKeyfile(decryptionKeyfile), { mode: 0o600 });
    };

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

    async updateArrayState({
        desiredState,
        decryptionPassword,
        decryptionKeyfile,
    }: ArrayStateInput): Promise<UnraidArray> {
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

        const command: Record<string, string> = {
            [`cmd${capitalCase(desiredState)}`]: capitalCase(desiredState),
            startState: constantCase(startState),
        };

        if (decryptionPassword && decryptionKeyfile) {
            throw new BadRequestException(
                new AppError('Provide either a decryption password or a decryption keyfile, not both.')
            );
        }

        if (desiredState === ArrayStateInputState.START && decryptionPassword) {
            command.luksKey = this.encodeDecryptionPassword(decryptionPassword);
        }

        if (desiredState === ArrayStateInputState.START && decryptionKeyfile) {
            await this.writeDecryptionKeyfile(decryptionKeyfile);
        }

        this.pendingState = newPendingState;

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
