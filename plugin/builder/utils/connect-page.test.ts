import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const pages = resolve(
    import.meta.dirname,
    '../../source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers'
);

describe('Connect settings navigation', () => {
    it('publishes Connect as a dedicated Settings subpage', async () => {
        const connect = await readFile(resolve(pages, 'ConnectTunnel.page'), 'utf8');
        const apiSettings = await readFile(resolve(pages, 'Connect.page'), 'utf8');

        expect(connect).toMatch(/^Menu="OtherSettings"$/m);
        expect(connect).not.toMatch(/^Menu="Settings"$/m);
        expect(connect).toMatch(/^Icon="<svg .*fill='currentColor'.*<\/svg>"$/m);
        expect(connect).toMatch(/^Tag="icon-unraid-social"$/m);
        expect(connect).toContain('.icon-unraid-social {');
        expect(apiSettings).not.toContain('href="/Settings/ConnectTunnel"');
    });
});
