import { expect, test } from 'vitest';
import { getShares } from '@app/core/utils/shares/get-shares';
import { store } from '@app/store';
import { loadStateFiles } from '@app/store/modules/emhttp';

test.fails('Returns all the servers shares', async () => {
	await store.dispatch(loadStateFiles());

	expect(getShares()).toMatchInlineSnapshot(`
		{
		  "disks": [],
		  "users": [
		    {
		      "allocator": "highwater",
		      "cachePool": "cache",
		      "color": "yellow-on",
		      "comment": "",
		      "cow": "auto",
		      "exclude": [],
		      "floor": "0",
		      "free": 9091184,
		      "include": [],
		      "luksStatus": "0",
		      "nameOrig": "appdata",
		      "nfs": {},
		      "size": 0,
		      "smb": {},
		      "splitLevel": "",
		      "type": "user",
		      "used": "32831348",
		    },
		    {
		      "allocator": "highwater",
		      "cachePool": "cache",
		      "color": "yellow-on",
		      "comment": "saved VM instances",
		      "cow": "auto",
		      "exclude": [],
		      "floor": "0",
		      "free": 9091184,
		      "include": [],
		      "luksStatus": "0",
		      "nameOrig": "domains",
		      "nfs": {},
		      "size": 0,
		      "smb": {},
		      "splitLevel": "1",
		      "type": "user",
		      "used": "32831348",
		    },
		    {
		      "allocator": "highwater",
		      "cachePool": "cache",
		      "color": "yellow-on",
		      "comment": "ISO images",
		      "cow": "auto",
		      "exclude": [],
		      "floor": "0",
		      "free": 9091184,
		      "include": [],
		      "luksStatus": "0",
		      "nameOrig": "isos",
		      "nfs": {},
		      "size": 0,
		      "smb": {},
		      "splitLevel": "",
		      "type": "user",
		      "used": "32831348",
		    },
		    {
		      "allocator": "highwater",
		      "cachePool": "cache",
		      "color": "yellow-on",
		      "comment": "system data",
		      "cow": "auto",
		      "exclude": [],
		      "floor": "0",
		      "free": 9091184,
		      "include": [],
		      "luksStatus": "0",
		      "nameOrig": "system",
		      "nfs": {},
		      "size": 0,
		      "smb": {},
		      "splitLevel": "1",
		      "type": "user",
		      "used": "32831348",
		    },
		  ],
		}
	`);
});

test('Returns all shares for label', async () => {
	await store.dispatch(loadStateFiles());
	const userShare = getShares('user');
	expect(userShare).toMatchInlineSnapshot(`
		{
		  "nfs": {
		    "enabled": false,
		    "hostList": "",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  "smb": {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  "type": "user",
		}
	`);

	expect(getShares('disk')).toMatchInlineSnapshot(`
		{
		  "free": NaN,
		  "name": undefined,
		  "nfs": {
		    "enabled": false,
		    "hostList": "",
		    "readList": [],
		    "security": "public",
		    "writeList": [],
		  },
		  "size": NaN,
		  "smb": {
		    "caseSensitive": "auto",
		    "enabled": true,
		    "fruit": "no",
		    "readList": [],
		    "security": "public",
		    "timemachine": {
		      "volsizelimit": NaN,
		    },
		    "writeList": [],
		  },
		  "type": "disk",
		}
	`);

	expect(getShares('users')).toMatchInlineSnapshot(`
		[
		  {
		    "allocator": "highwater",
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "nameOrig": "appdata",
		    "nfs": {},
		    "size": 0,
		    "smb": {},
		    "splitLevel": "",
		    "type": "user",
		    "used": "32831348",
		  },
		  {
		    "allocator": "highwater",
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "saved VM instances",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "nameOrig": "domains",
		    "nfs": {},
		    "size": 0,
		    "smb": {},
		    "splitLevel": "1",
		    "type": "user",
		    "used": "32831348",
		  },
		  {
		    "allocator": "highwater",
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "ISO images",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "nameOrig": "isos",
		    "nfs": {},
		    "size": 0,
		    "smb": {},
		    "splitLevel": "",
		    "type": "user",
		    "used": "32831348",
		  },
		  {
		    "allocator": "highwater",
		    "cachePool": "cache",
		    "color": "yellow-on",
		    "comment": "system data",
		    "cow": "auto",
		    "exclude": [],
		    "floor": "0",
		    "free": 9091184,
		    "include": [],
		    "luksStatus": "0",
		    "nameOrig": "system",
		    "nfs": {},
		    "size": 0,
		    "smb": {},
		    "splitLevel": "1",
		    "type": "user",
		    "used": "32831348",
		  },
		]
	`);

	expect(getShares('disks')).toMatchInlineSnapshot('[]');
});
