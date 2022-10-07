import { test, expect } from 'vitest';
import { parse } from 'ini';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { Serializer } from 'multi-ini';

test('MultiIni breaks when serializing an object with a boolean inside', async () => {
	const objectToSerialize = {
		root: {
			anonMode: false,
		},
	};
	const serializer = new Serializer({ keep_quotes: false });
	expect(() => serializer.serialize(objectToSerialize)).toThrowErrorMatchingInlineSnapshot('"value.match is not a function"');
});

test('MultiIni can safely serialize an object with a boolean inside', async () => {
	const objectToSerialize = {
		root: {
			anonMode: false,
		},
	};
	expect(safelySerializeObjectToIni(objectToSerialize)).toMatchInlineSnapshot(`
		"[root]
		anonMode=\\"false\\"
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
