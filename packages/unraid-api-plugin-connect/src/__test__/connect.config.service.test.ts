import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { emptyMyServersConfig } from '../config/connect.config.js';
import { ConnectConfigService } from '../config/connect.config.service.js';

describe('ConnectConfigService sign-out', () => {
    const temporaryDirectories: string[] = [];

    afterEach(async () => {
        await Promise.all(
            temporaryDirectories
                .splice(0)
                .map((directory) => rm(directory, { recursive: true, force: true }))
        );
    });

    it('persists the cleared identity and removes the legacy source of the key', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const configService = new ConfigService({
            connect: {
                config: {
                    ...emptyMyServersConfig(),
                    apikey: 'current-key',
                    username: 'signed-in-user',
                    wanaccess: true,
                    wanport: 33443,
                },
            },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });

        await new ConnectConfigService(configService).resetUser();

        const persisted = JSON.parse(await readFile(join(directory, 'connect.json'), 'utf8'));
        expect(persisted.apikey).toBe('');
        expect(persisted.username).toBe('');
        expect(persisted.wanaccess).toBe(true);
        expect(persisted.wanport).toBe(33443);
        await expect(readFile(legacyPath)).rejects.toThrow();
    });

    it('keeps the legacy config when the cleared identity cannot be persisted', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const blockedPath = join(directory, 'blocked');
        await writeFile(blockedPath, 'not a directory');
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: blockedPath,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });

        await expect(new ConnectConfigService(configService).resetUser()).rejects.toThrow();
        expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
    });
});
