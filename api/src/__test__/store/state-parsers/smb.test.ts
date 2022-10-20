import { join } from 'path';
import { expect, test } from 'vitest';
import { store } from '@app/store';
import type { SmbIni } from '@app/store/state-parsers/smb';

test('Returns parsed state file', async () => {
	const { parse } = await import('@app/store/state-parsers/smb');
	const { parseConfig } = await import('@app/core/utils/misc/parse-config');
	const { paths } = store.getState();
	const filePath = join(paths.states, 'sec.ini');
	const stateFile = parseConfig<SmbIni>({
		filePath,
		type: 'ini',
	});
	expect(parse(stateFile)).toMatchInlineSnapshot(`
		[
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk1",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk2",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk3",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk4",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk5",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk6",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk7",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk8",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk9",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk10",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk11",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk12",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk13",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk14",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk15",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk16",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk17",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk18",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk19",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk20",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk21",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "disk22",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "name": "abc",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  {
		    "enabled": true,
		    "fruit": "no",
		    "name": "flash",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		]
	`);
});
