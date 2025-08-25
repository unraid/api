import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { toNumberAlways } from '@unraid/shared/util/data.js';
import { GraphQLError } from 'graphql';

import { ParityCheckStatus } from '@app/core/modules/array/parity-check-status.js';
import { emcmd } from '@app/core/utils/index.js';
import { ParityCheck } from '@app/unraid-api/graph/resolvers/array/parity.model.js';

@Injectable()
export class ParityService {
    constructor() {}

    async getParityHistory(): Promise<ParityCheck[]> {
        const { getters } = await import('@app/store/index.js');

        const historyFilePath = getters.paths()['parity-checks'];
        const history = await readFile(historyFilePath).catch(() => {
            throw new Error(`Parity history file not found: ${historyFilePath}`);
        });

        // Convert checks into array of objects
        const lines = history.toString().trim().split('\n').reverse();
        return lines.map<ParityCheck>((line) => {
            const [date, duration, speed, status, errors = '0'] = line.split('|');
            return {
                date: new Date(date),
                duration: Number.parseInt(duration, 10),
                speed: speed ?? 'Unavailable',
                // use http 422 (unprocessable entity) as fallback to differentiate from unix error codes
                // when status is not a number.
                status: this.statusCodeToStatusEnum(toNumberAlways(status, 422)),
                errors: Number.parseInt(errors, 10),
            };
        });
    }

    statusCodeToStatusEnum(statusCode: number): ParityCheckStatus {
        return statusCode === -4
            ? ParityCheckStatus.CANCELLED
            : toNumberAlways(statusCode, 0) === 0
              ? ParityCheckStatus.COMPLETED
              : ParityCheckStatus.FAILED;
    }

    /**
     * Updates the parity check state
     * @param wantedState - The desired state for the parity check ('pause', 'resume', 'cancel', 'start')
     * @param correct - Whether to write corrections to parity (only applicable for 'start' state)
     * @returns The updated array data
     */
    async updateParityCheck({
        wantedState,
        correct,
    }: {
        wantedState: 'pause' | 'resume' | 'cancel' | 'start';
        correct: boolean;
    }): Promise<ParityCheck[]> {
        const { getters } = await import('@app/store/index.js');
        const running = getters.emhttp().var.mdResync !== 0;
        const states = {
            pause: {
                cmdNoCheck: 'Pause',
            },
            resume: {
                cmdCheck: 'Resume',
            },
            cancel: {
                cmdNoCheck: 'Cancel',
            },
            start: {
                cmdCheck: 'Check',
            },
        };

        let allowedStates = Object.keys(states);

        // Only allow starting a check if there isn't already one running
        if (running) {
            // Remove 'start' from allowed states when a check is already running
            allowedStates = allowedStates.filter((state) => state !== 'start');
        }

        // Only allow states from states object
        if (!allowedStates.includes(wantedState)) {
            throw new GraphQLError(`Invalid parity check state: ${wantedState}`);
        }

        // Should we write correction to the parity during the check
        const writeCorrectionsToParity = wantedState === 'start' && correct;

        try {
            await emcmd({
                startState: 'STARTED',
                ...states[wantedState],
                ...(writeCorrectionsToParity ? { optionCorrect: 'correct' } : {}),
            });
        } catch (error) {
            throw new GraphQLError(
                `Failed to update parity check: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        return this.getParityHistory();
    }
}
