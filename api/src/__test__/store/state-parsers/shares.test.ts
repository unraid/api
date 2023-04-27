import { join } from 'path';
import { expect, test } from 'vitest';
import { store } from '@app/store';
import type { SharesIni } from '@app/store/state-parsers/shares';

test('Returns parsed state file', async () => {
	const { parse } = await import('@app/store/state-parsers/shares');
	const { parseConfig } = await import('@app/core/utils/misc/parse-config');
	const { paths } = store.getState();
	const filePath = join(paths.states, 'shares.ini');
	const stateFile = parseConfig<SharesIni>({
		filePath,
		type: 'ini',
	});
	expect(parse(stateFile)).toMatchInlineSnapshot(`
		[
		  {
		    "allocator": "highwater",
		    "cache": false,
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "name": "appdata",
		    "nameOrig": "appdata",
		    "size": 0,
		    "splitLevel": "",
		    "used": 32831348,
		  },
		  {
		    "allocator": "highwater",
		    "cache": false,
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "saved VM instances",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "name": "domains",
		    "nameOrig": "domains",
		    "size": 0,
		    "splitLevel": "1",
		    "used": 32831348,
		  },
		  {
		    "allocator": "highwater",
		    "cache": true,
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "ISO images",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "name": "isos",
		    "nameOrig": "isos",
		    "size": 0,
		    "splitLevel": "",
		    "used": 32831348,
		  },
		  {
		    "allocator": "highwater",
		    "cache": false,
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "system data",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "name": "system",
		    "nameOrig": "system",
		    "size": 0,
		    "splitLevel": "1",
		    "used": 32831348,
		  },
		]
	`);
});
