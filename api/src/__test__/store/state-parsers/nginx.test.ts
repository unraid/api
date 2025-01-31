import { join } from 'path';

import { expect, test } from 'vitest';

import type { NginxIni } from '@app/store/state-parsers/nginx';
import { store } from '@app/store';

test('Returns parsed state file', async () => {
    const { parse } = await import('@app/store/state-parsers/nginx');
    const { parseConfig } = await import('@app/core/utils/misc/parse-config');
    const { paths } = store.getState();
    const filePath = join(paths.states, 'nginx.ini');
    const stateFile = parseConfig<NginxIni>({
        filePath,
        type: 'ini',
    });
    expect(parse(stateFile)).toMatchSnapshot();
});
