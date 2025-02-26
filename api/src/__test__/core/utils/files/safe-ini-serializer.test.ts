import { parse } from 'ini';
import { Serializer } from 'multi-ini';
import { expect, test } from 'vitest';

import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer.js';

test('MultiIni breaks when serializing an object with a boolean inside', async () => {
    const objectToSerialize = {
        root: {
            anonMode: false,
        },
    };
    const serializer = new Serializer({ keep_quotes: false });
    expect(serializer.serialize(objectToSerialize)).toMatchInlineSnapshot(`
		"[root]
		anonMode=false
		"
	`);
});

test('MultiIni can safely serialize an object with a boolean inside', async () => {
    const objectToSerialize = {
        root: {
            anonMode: false,
        },
    };
    expect(safelySerializeObjectToIni(objectToSerialize)).toMatchInlineSnapshot(`
		"[root]
		anonMode="false"
		"
	`);
    const result = safelySerializeObjectToIni(objectToSerialize);
    expect(parse(result)).toMatchInlineSnapshot(`
		{
		  "root": {
		    "anonMode": false,
		  },
		}
	`);
});

test.skip('Can serialize top-level fields', async () => {
    const objectToSerialize = {
        id: 'an-id',
        message: 'hello-world',
        number: 1,
        float: 1.1,
        flag: true,
        flag2: false,
        item: undefined,
        missing: null,
        empty: {},
    };

    const expected = `
			"id=an-id
			message=hello-world
			number=1
			float=1.1
			flag="true"
			flag2="false"
			[empty]
			"
			`
        .split('\n')
        .map((line) => line.trim())
        .join('\n');

    expect(safelySerializeObjectToIni(objectToSerialize)).toMatchInlineSnapshot(expected);
});
