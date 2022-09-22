import { test, expect } from 'vitest';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { read as multiIniRead, Parser as MultiIniParser } from 'multi-ini';

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
	console.log(res);
	expect(res.DOMAIN_SHORT).toEqual(undefined);
	expect(res.domainShort).toEqual('');
	expect(res.shareCount).toEqual('0');
});

test()