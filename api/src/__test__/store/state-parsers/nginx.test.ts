import { join } from 'path';

import { expect, test } from 'vitest';

import type { NginxIni } from '@app/store/state-parsers/nginx.js';
import { store } from '@app/store/index.js';

test('Returns parsed state file', async () => {
    const { parse } = await import('@app/store/state-parsers/nginx.js');
    const { parseConfig } = await import('@app/core/utils/misc/parse-config.js');
    const { paths } = store.getState();
    const filePath = join(paths.states, 'nginx.ini');
    const stateFile = parseConfig<NginxIni>({
        filePath,
        type: 'ini',
    });
    expect(parse(stateFile)).toMatchSnapshot();
});
