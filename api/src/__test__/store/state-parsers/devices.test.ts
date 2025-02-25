import { join } from 'path';

import { expect, test } from 'vitest';

import type { DevicesIni } from '@app/store/state-parsers/devices.js';
import { store } from '@app/store/index.js';

test('Returns parsed state file', async () => {
    const { parse } = await import('@app/store/state-parsers/devices.js');
    const { parseConfig } = await import('@app/core/utils/misc/parse-config.js');
    const { paths } = store.getState();
    const filePath = join(paths.states, 'devs.ini');
    const stateFile = parseConfig<DevicesIni>({
        filePath,
        type: 'ini',
    });
    expect(parse(stateFile)).toMatchInlineSnapshot('[]');
});
