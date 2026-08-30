import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { validateConnectConnector } from './connect-connector';

const source = resolve(import.meta.dirname, '../../source');
const relative = 'dynamix.unraid.net/usr/local/bin/unraid-connect-connector';
describe('vendored connector packaging', () => {
    it('packages an executable Linux artifact with the pinned checksum and shared contract', async () => {
        await expect(validateConnectConnector(source)).resolves.toBeUndefined();
        const manifest = JSON.parse(await readFile(join(source, `${relative}.json`), 'utf8'));
        const binary = await readFile(join(source, relative));
        const contract = await readFile(
            resolve(
                source,
                '../../packages/unraid-api-plugin-connect/src/tunnel/contracts/server-overview-v1.schema.json'
            )
        );
        expect(createHash('sha256').update(contract).digest('hex')).toBe(manifest.overviewSchemaSha256);
        expect(binary.includes(Buffer.from('/run/unraid-connect/connector.sock'))).toBe(true);
    });
    it('rejects a changed binary before packaging', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-package-'));
        try {
            await cp(
                join(source, 'dynamix.unraid.net/usr/local'),
                join(directory, 'dynamix.unraid.net/usr/local'),
                { recursive: true }
            );
            await writeFile(join(directory, relative), 'not the connector');
            await expect(validateConnectConnector(directory)).rejects.toThrow();
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
