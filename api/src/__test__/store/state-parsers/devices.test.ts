import { join } from 'path';
import { expect, test } from 'vitest';
import { store } from '@app/store';
import type { DevicesIni } from '@app/store/state-parsers/devices';

test('Returns parsed state file', async () => {
	const { parse } = await import('@app/store/state-parsers/devices');
	const { parseConfig } = await import('@app/core/utils/misc/parse-config');
	const { paths } = store.getState();
	const filePath = join(paths.states, 'devs.ini');
	const stateFile = parseConfig<DevicesIni>({
		filePath,
		type: 'ini',
	});
	expect(parse(stateFile)).toMatchInlineSnapshot('[]');
});
