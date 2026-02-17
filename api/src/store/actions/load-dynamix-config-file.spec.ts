import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadDynamixConfigFromDiskSync } from '@app/store/actions/load-dynamix-config-file.js';

describe('loadDynamixConfigFromDiskSync', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
        tempDirs.length = 0;
    });

    it('deep merges section keys across config files', () => {
        const dir = mkdtempSync(join(tmpdir(), 'dynamix-config-merge-'));
        tempDirs.push(dir);

        const defaultConfigPath = join(dir, 'default.cfg');
        const userConfigPath = join(dir, 'dynamix.cfg');

        writeFileSync(
            defaultConfigPath,
            [
                '[display]',
                'theme=white',
                'terminalButton=yes',
                'locale=en_US',
                '',
                '[notify]',
                'display=0',
                '',
            ].join('\n')
        );

        writeFileSync(userConfigPath, ['[display]', 'theme=gray', ''].join('\n'));

        const result = loadDynamixConfigFromDiskSync([defaultConfigPath, userConfigPath]);

        expect(result).toEqual({
            display: {
                theme: 'gray',
                terminalButton: 'yes',
                locale: 'en_US',
            },
            notify: {
                display: '0',
            },
        });
    });

    it('returns empty object when no config paths are provided', () => {
        const result = loadDynamixConfigFromDiskSync([]);
        expect(result).toEqual({});
    });
});
