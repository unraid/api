import { promises as fs } from 'fs';

import Table from 'cli-table';

import { FileMissingError } from '@app/core/errors/file-missing-error.js';
import { type CoreContext, type CoreResult } from '@app/core/types/index.js';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission.js';
import { getters } from '@app/store/index.js';

/**
 * Get parity history.
 * @returns  All parity checks with their respective date, duration, speed, status and errors.
 */
export const getParityHistory = async (context: CoreContext): Promise<CoreResult> => {
    const { user } = context;

    // Bail if the user doesn't have permission
    ensurePermission(user, {
        resource: 'parity-history',
        action: 'read',
        possession: 'any',
    });

    const historyFilePath = getters.paths()['parity-checks'];
    const history = await fs.readFile(historyFilePath).catch(() => {
        throw new FileMissingError(historyFilePath);
    });

    // Convert checks into array of objects
    const lines = history.toString().trim().split('\n').reverse();
    const parityChecks = lines.map((line) => {
        const [date, duration, speed, status, errors = '0'] = line.split('|');
        return {
            date,
            duration: Number.parseInt(duration, 10),
            speed,
            status,
            errors: Number.parseInt(errors, 10),
        };
    });

    // Create table for text output
    const table = new Table({
        head: ['Date', 'Duration', 'Speed', 'Status', 'Errors'],
    });
    // Update raw values with strings
    parityChecks.forEach((check) => {
        const array = Object.values({
            date: check.date,
            speed: check.speed ? check.speed : 'Unavailable',
            duration: check.duration >= 0 ? check.duration.toString() : 'Unavailable',
            status: check.status === '-4' ? 'Cancelled' : 'OK',
            errors: check.errors.toString(),
        });
        table.push(array);
    });

    return {
        text: table.toString(),
        json: parityChecks,
    };
};
