import { test, expect } from 'vitest';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { Parser as MultiIniParser } from 'multi-ini';
import { readFile, writeFile } from 'fs/promises';
import { parse } from 'ini';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';

const iniTestData = `["root"]
idx="0"
name="root"
desc="Console and webGui login account"
passwd="yes"
["xo"]
idx="1"
name="xo"
desc=""
passwd="yes"
["test_user"]
idx="2"
name="test_user"
desc=""
passwd="no"`;

test('it loads a config from a passed in ini file successfully', () => {
	const res = parseConfig<any>({
		file: iniTestData,
		type: 'ini',
	});
	expect(res).toMatchInlineSnapshot(`
		{
		  "root": {
		    "desc": "Console and webGui login account",
		    "idx": "0",
		    "name": "root",
		    "passwd": "yes",
		  },
		  "testUser": {
		    "desc": "",
		    "idx": "2",
		    "name": "test_user",
		    "passwd": "no",
		  },
		  "xo": {
		    "desc": "",
		    "idx": "1",
		    "name": "xo",
		    "passwd": "yes",
		  },
		}
	`);
	expect(res?.root.desc).toEqual('Console and webGui login account');
});

test('it loads a config from disk properly', () => {
	const path = './dev/states/var.ini';
	const res = parseConfig<any>({ filePath: path, type: 'ini' });
	expect(res.DOMAIN_SHORT).toEqual(undefined);
	expect(res.domainShort).toEqual('');
	expect(res.shareCount).toEqual('0');
});

test('Confirm Multi-Ini Parser Still Broken', () => {
	const parser = new MultiIniParser();
	const res = parser.parse(iniTestData);
	expect(res).toMatchInlineSnapshot('{}');
});

test('Combine Ini and Multi-Ini to read and then write a file with quotes', async () => {
	const parsedFile = parse(iniTestData);
	expect(parsedFile).toMatchInlineSnapshot(`
		{
		  "root": {
		    "desc": "Console and webGui login account",
		    "idx": "0",
		    "name": "root",
		    "passwd": "yes",
		  },
		  "test_user": {
		    "desc": "",
		    "idx": "2",
		    "name": "test_user",
		    "passwd": "no",
		  },
		  "xo": {
		    "desc": "",
		    "idx": "1",
		    "name": "xo",
		    "passwd": "yes",
		  },
		}
	`);

	const ini = safelySerializeObjectToIni(parsedFile);
	await writeFile('/tmp/test.ini', ini);
	const file = await readFile('/tmp/test.ini', 'utf-8');
	expect(file).toMatchInlineSnapshot(`
		"[root]
		idx=\\"0\\"
		name=\\"root\\"
		desc=\\"Console and webGui login account\\"
		passwd=\\"yes\\"
		[xo]
		idx=\\"1\\"
		name=\\"xo\\"
		desc=\\"\\"
		passwd=\\"yes\\"
		[test_user]
		idx=\\"2\\"
		name=\\"test_user\\"
		desc=\\"\\"
		passwd=\\"no\\"
		"
	`);
});
