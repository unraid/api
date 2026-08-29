import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createAjv } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';

import { overview, writeOverview } from './overview.js';

const contract = JSON.parse(
    await readFile(new URL('./contracts/server-overview-v1.schema.json', import.meta.url), 'utf8')
);
// This contract uses only keywords common to draft 7 and 2020-12.
const { $schema, ...schema } = contract;
const validate = createAjv({ strict: false }).compile(schema);

describe('server overview contract', () => {
    it('exports only contract fields and uses logical disk names, not hardware identity', () => {
        const value = overview(
            { version: '7.2.0', name: 'Tower', mdState: 'STARTED', regGUID: 'private-guid' },
            [
                {
                    name: 'disk1',
                    type: 'ARRAY',
                    id: 'serial-secret',
                    device: '/dev/sda',
                    fsSize: 100,
                    fsFree: 30,
                    fsUsed: 70,
                    numErrors: 1,
                },
                { name: 'parity', type: 'PARITY', fsSize: 100, fsFree: 0, fsUsed: 100 },
                { name: 'cache', type: 'CACHE', fsSize: 50, fsFree: 20, fsUsed: 30 },
                { name: 'cache2', type: 'CACHE', fsSize: 50, fsFree: 20, fsUsed: 30 },
                { name: 'flash', type: 'FLASH', id: 'flash-guid' },
            ],
            [{ type: 'LAN', url: new URL('https://tower.local'), secret: 'credential' }],
            '2026-01-01T00:00:00.000Z',
            {
                docker: ['RUNNING', 'EXITED', 'PAUSED'],
                virtualMachines: ['RUNNING', 'IDLE', 'SHUTOFF', 'PAUSED'],
            }
        );
        expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
        expect(value.storage.pools['array:array']).toMatchObject({
            fsSize: 100,
            fsFree: 30,
            fsUsed: 70,
        });
        expect(value.storage.pools['pool:cache'].fsSize).toBe(50);
        expect(Object.keys(value.storage.pools['pool:cache'].drives)).toEqual([
            'drive:cache',
            'drive:cache2',
        ]);
        expect(value.workloads).toEqual({
            docker: { state: 'available', running: 1, stopped: 1, paused: 1, total: 3 },
            virtualMachines: {
                state: 'available',
                running: 2,
                stopped: 1,
                paused: 1,
                total: 4,
            },
        });
        expect(JSON.stringify(value)).not.toMatch(
            /serial-secret|private-guid|\/dev\/sda|flash-guid|credential/
        );
        expect(validate({ ...value, secret: 'private' })).toBe(false);
    });
    it('reports unavailable subsystems without exposing workload identity', () => {
        const value = overview({}, [], [], null, {
            docker: null,
            virtualMachines: null,
        });
        expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
        expect(value.workloads).toEqual({
            docker: { state: 'unavailable', running: 0, stopped: 0, paused: 0, total: 0 },
            virtualMachines: {
                state: 'unavailable',
                running: 0,
                stopped: 0,
                paused: 0,
                total: 0,
            },
        });
    });
    it('keeps absent state and unknown capacity valid', () => {
        for (const value of [
            overview(null, null, null, null),
            overview({}, [{ name: 'disk1', type: 'ARRAY', fsSize: NaN }], [], null),
        ]) {
            expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
        }
    });
    it('atomically replaces and clears private state without rewriting unchanged contents', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-overview-'));
        const path = join(directory, 'state.json');
        try {
            const value = overview({ name: 'Tower' }, [], [], null);
            await writeOverview(path, value);
            const first = await stat(path);
            await writeOverview(path, value);
            expect((await stat(path)).mtimeMs).toBe(first.mtimeMs);
            expect(first.mode & 0o777).toBe(0o600);
            await writeOverview(path, overview({}, [], [], null));
            expect(await readFile(path, 'utf8')).not.toContain('Tower');
            await expect(stat(`${path}.tmp`)).rejects.toThrow();
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
