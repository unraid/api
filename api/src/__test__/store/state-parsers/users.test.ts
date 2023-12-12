import { join } from 'path';
import { expect, test } from 'vitest';
import { store } from '@app/store';
import type { UsersIni } from '@app/store/state-parsers/users';

test('Returns parsed state file', async () => {
	const { parse } = await import('@app/store/state-parsers/users');
	const { parseConfig } = await import('@app/core/utils/misc/parse-config');
	const { paths } = store.getState();
	const filePath = join(paths.states, 'users.ini');
	const stateFile = parseConfig<UsersIni>({
		filePath,
		type: 'ini',
	});
	expect(parse(stateFile)).toMatchInlineSnapshot(`
		[
		  {
		    "description": "Console and webGui login account",
		    "id": "0",
		    "name": "root",
		    "password": true,
		    "role": "admin",
		  },
		  {
		    "description": "",
		    "id": "1",
		    "name": "xo",
		    "password": true,
		    "role": "user",
		  },
		  {
		    "description": "",
		    "id": "2",
		    "name": "test_user",
		    "password": false,
		    "role": "user",
		  },
		]
	`);
});
