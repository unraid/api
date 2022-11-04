import { join } from 'path';
import { expect, test } from 'vitest';
import { store } from '@app/store';
import type { NfsSharesIni } from '@app/store/state-parsers/nfs';

test('Returns parsed state file', async () => {
	const { parse } = await import('@app/store/state-parsers/nfs');
	const { parseConfig } = await import('@app/core/utils/misc/parse-config');
	const { paths } = store.getState();
	const filePath = join(paths.states, 'sec_nfs.ini');
	const stateFile = parseConfig<NfsSharesIni>({
		filePath,
		type: 'ini',
	});
	expect(parse(stateFile)).toMatchInlineSnapshot(`
		[
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk1",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk2",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk3",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk4",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk5",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk6",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk7",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk8",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk9",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk10",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk11",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk12",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk13",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk14",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk15",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk16",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk17",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk18",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk19",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk20",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk21",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "disk22",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  {
		    "enabled": false,
		    "hostList": "",
		    "name": "abc",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		]
	`);
});
