import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

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
                status: status === '-4' ? 'Cancelled' : 'OK',
                errors: Number.parseInt(errors, 10),
            };
        });
    }
}
