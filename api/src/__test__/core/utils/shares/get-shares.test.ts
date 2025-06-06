import { expect, test } from 'vitest';

import { getShares } from '@app/core/utils/shares/get-shares.js';
import { store } from '@app/store/index.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';

test('Returns both disk and user shares', async () => {
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
            "free": 9309372,
            "id": "appdata",
            "include": [],
            "luksStatus": "0",
            "name": "appdata",
            "nameOrig": "appdata",
            "nfs": {},
            "size": 0,
            "smb": {},
            "splitLevel": "",
            "type": "user",
            "used": 33619300,
          },
          {
            "allocator": "highwater",
            "cachePool": "cache",
            "color": "yellow-on",
            "comment": "saved VM instances",
            "cow": "auto",
            "exclude": [],
            "floor": "0",
            "free": 9309372,
            "id": "domains",
            "include": [],
            "luksStatus": "0",
            "name": "domains",
            "nameOrig": "domains",
            "nfs": {},
            "size": 0,
            "smb": {},
            "splitLevel": "1",
            "type": "user",
            "used": 33619300,
          },
          {
            "allocator": "highwater",
            "cachePool": "cache",
            "color": "yellow-on",
            "comment": "ISO images",
            "cow": "auto",
            "exclude": [],
            "floor": "0",
            "free": 9309372,
            "id": "isos",
            "include": [],
            "luksStatus": "0",
            "name": "isos",
            "nameOrig": "isos",
            "nfs": {},
            "size": 0,
            "smb": {},
            "splitLevel": "",
            "type": "user",
            "used": 33619300,
          },
          {
            "allocator": "highwater",
            "cachePool": "cache",
            "color": "yellow-on",
            "comment": "system data",
            "cow": "auto",
            "exclude": [],
            "floor": "0",
            "free": 9309372,
            "id": "system",
            "include": [],
            "luksStatus": "0",
            "name": "system",
            "nameOrig": "system",
            "nfs": {},
            "size": 0,
            "smb": {},
            "splitLevel": "1",
            "type": "user",
            "used": 33619300,
          },
        ],
      }
    `);
});

test('Returns shares by type', async () => {
    await store.dispatch(loadStateFiles());
    expect(getShares('user')).toMatchInlineSnapshot(`
      {
        "allocator": "highwater",
        "cachePool": "cache",
        "color": "yellow-on",
        "comment": "",
        "cow": "auto",
        "exclude": [],
        "floor": "0",
        "free": 9309372,
        "id": "appdata",
        "include": [],
        "luksStatus": "0",
        "name": "appdata",
        "nameOrig": "appdata",
        "nfs": {},
        "size": 0,
        "smb": {},
        "splitLevel": "",
        "type": "user",
        "used": 33619300,
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
          "free": 9309372,
          "id": "appdata",
          "include": [],
          "luksStatus": "0",
          "name": "appdata",
          "nameOrig": "appdata",
          "nfs": {},
          "size": 0,
          "smb": {},
          "splitLevel": "",
          "type": "user",
          "used": 33619300,
        },
        {
          "allocator": "highwater",
          "cachePool": "cache",
          "color": "yellow-on",
          "comment": "saved VM instances",
          "cow": "auto",
          "exclude": [],
          "floor": "0",
          "free": 9309372,
          "id": "domains",
          "include": [],
          "luksStatus": "0",
          "name": "domains",
          "nameOrig": "domains",
          "nfs": {},
          "size": 0,
          "smb": {},
          "splitLevel": "1",
          "type": "user",
          "used": 33619300,
        },
        {
          "allocator": "highwater",
          "cachePool": "cache",
          "color": "yellow-on",
          "comment": "ISO images",
          "cow": "auto",
          "exclude": [],
          "floor": "0",
          "free": 9309372,
          "id": "isos",
          "include": [],
          "luksStatus": "0",
          "name": "isos",
          "nameOrig": "isos",
          "nfs": {},
          "size": 0,
          "smb": {},
          "splitLevel": "",
          "type": "user",
          "used": 33619300,
        },
        {
          "allocator": "highwater",
          "cachePool": "cache",
          "color": "yellow-on",
          "comment": "system data",
          "cow": "auto",
          "exclude": [],
          "floor": "0",
          "free": 9309372,
          "id": "system",
          "include": [],
          "luksStatus": "0",
          "name": "system",
          "nameOrig": "system",
          "nfs": {},
          "size": 0,
          "smb": {},
          "splitLevel": "1",
          "type": "user",
          "used": 33619300,
        },
      ]
    `);
    expect(getShares('disk')).toMatchInlineSnapshot('null');
    expect(getShares('disks')).toMatchInlineSnapshot('[]');
});

test('Returns shares by name', async () => {
    await store.dispatch(loadStateFiles());
    expect(getShares('user', { name: 'domains' })).toMatchInlineSnapshot(`
      {
        "allocator": "highwater",
        "cachePool": "cache",
        "color": "yellow-on",
        "comment": "saved VM instances",
        "cow": "auto",
        "exclude": [],
        "floor": "0",
        "free": 9309372,
        "id": "domains",
        "include": [],
        "luksStatus": "0",
        "name": "domains",
        "nameOrig": "domains",
        "nfs": {},
        "size": 0,
        "smb": {},
        "splitLevel": "1",
        "type": "user",
        "used": 33619300,
      }
    `);
    expect(getShares('user', { name: 'non-existent-user-share' })).toMatchInlineSnapshot('null');
    // @TODO: disk shares need to be added to the dev ini files
    expect(getShares('disk', { name: 'disk1' })).toMatchInlineSnapshot('null');
    expect(getShares('disk', { name: 'non-existent-disk-share' })).toMatchInlineSnapshot('null');
});
