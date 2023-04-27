import { test, expect } from 'vitest';
import { store } from '@app/store';
import { FileLoadStatus } from '@app/store/types';

// Preloading imports for faster tests
import '@app/store/modules/emhttp';

test('Before init returns default values for all fields', async () => {
	const { status, ...state } = store.getState().emhttp;
	expect(status).toBe(FileLoadStatus.UNLOADED);
	expect(state).toMatchInlineSnapshot(`
		{
		  "devices": [],
		  "disks": [],
		  "networks": [],
		  "nfsShares": [],
		  "nginx": {},
		  "shares": [],
		  "smbShares": [],
		  "users": [],
		  "var": {},
		}
	`);
});

test('After init returns values from cfg file for all fields', async () => {
	const { loadStateFiles } = await import('@app/store/modules/emhttp');

	// Load state files into store
	await store.dispatch(loadStateFiles());

	// Check if store has state files loaded
	const { devices, networks, nfsShares, nginx, shares, disks, smbShares, status, users, var: varState } = store.getState().emhttp;
	expect(status).toBe(FileLoadStatus.LOADED);
	expect(devices).toMatchInlineSnapshot('[]');
	expect(networks).toMatchInlineSnapshot(`
		[
		  {
		    "bonding": true,
		    "bondingMiimon": "100",
		    "bondingMode": "1",
		    "bondname": "",
		    "bondnics": [
		      "eth0",
		      "eth1",
		      "eth2",
		      "eth3",
		    ],
		    "brfd": "0",
		    "bridging": true,
		    "brname": "",
		    "brnics": "bond0",
		    "brstp": "0",
		    "description": [
		      "",
		    ],
		    "dhcp6Keepresolv": false,
		    "dhcpKeepresolv": false,
		    "dnsServer1": "1.1.1.1",
		    "dnsServer2": "8.8.8.8",
		    "gateway": [
		      "192.168.1.1",
		    ],
		    "gateway6": [
		      "",
		    ],
		    "ipaddr": [
		      "192.168.1.150",
		    ],
		    "ipaddr6": [
		      "",
		    ],
		    "metric": [
		      "",
		    ],
		    "metric6": [
		      "",
		    ],
		    "mtu": "",
		    "netmask": [
		      "255.255.255.0",
		    ],
		    "netmask6": [
		      "",
		    ],
		    "privacy6": [
		      "",
		    ],
		    "protocol": [
		      "",
		    ],
		    "type": "access",
		    "useDhcp": [
		      true,
		    ],
		    "useDhcp6": [
		      false,
		    ],
		  },
		]
	`);
	expect(nginx).toMatchInlineSnapshot(`
		{
		  "certificateName": "*.thisisfourtyrandomcharacters012345678900.myunraid.net",
		  "certificatePath": "/boot/config/ssl/certs/certificate_bundle.pem",
		  "defaultUrl": "https://Tower.local:4443",
		  "httpPort": 8080,
		  "httpsPort": 4443,
		  "lanFqdn": "192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net",
		  "lanFqdn6": "",
		  "lanIp": "192.168.1.150",
		  "lanIp6": "",
		  "lanMdns": "Tower.local",
		  "lanName": "Tower",
		  "sslEnabled": true,
		  "sslMode": "yes",
		  "wanAccessEnabled": false,
		  "wanFqdn": "85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net",
		  "wanFqdn6": "",
		  "wanIp": "",
		  "wgFqdns": [
		    {
		      "fqdn": "10-252-0-1.hash.myunraid.net",
		      "id": 0,
		    },
		    {
		      "fqdn": "10-252-1-1.hash.myunraid.net",
		      "id": 1,
		    },
		    {
		      "fqdn": "10-253-3-1.hash.myunraid.net",
		      "id": 3,
		    },
		    {
		      "fqdn": "10-253-4-1.hash.myunraid.net",
		      "id": 4,
		    },
		    {
		      "fqdn": "10-253-5-1.hash.myunraid.net",
		      "id": 55,
		    },
		  ],
		}
	`);
	expect(disks).toMatchInlineSnapshot(`
		[
		  {
		    "comment": null,
		    "critical": null,
		    "device": "sdh",
		    "exportable": false,
		    "format": "GPT: 4KiB-aligned",
		    "fsFree": null,
		    "fsSize": null,
		    "fsType": null,
		    "fsUsed": null,
		    "id": "ST18000NM000J-2TV103_ZR585CPY",
		    "idx": 0,
		    "name": "parity",
		    "numErrors": 0,
		    "numReads": 0,
		    "numWrites": 0,
		    "rotational": true,
		    "size": 17578328012,
		    "status": "DISK_OK",
		    "temp": 25,
		    "transport": "ata",
		    "type": "Parity",
		    "warning": null,
		  },
		  {
		    "comment": "Seagate Exos",
		    "critical": 75,
		    "device": "sdf",
		    "exportable": false,
		    "format": "GPT: 4KiB-aligned",
		    "fsFree": 13882739732,
		    "fsSize": 17998742753,
		    "fsType": "xfs",
		    "fsUsed": 4116003021,
		    "id": "ST18000NM000J-2TV103_ZR5B1W9X",
		    "idx": 1,
		    "name": "disk1",
		    "numErrors": 0,
		    "numReads": 0,
		    "numWrites": 0,
		    "rotational": true,
		    "size": 17578328012,
		    "status": "DISK_OK",
		    "temp": 30,
		    "transport": "ata",
		    "type": "Data",
		    "warning": 50,
		  },
		  {
		    "comment": "",
		    "critical": null,
		    "device": "sdj",
		    "exportable": false,
		    "format": "GPT: 4KiB-aligned",
		    "fsFree": 93140746,
		    "fsSize": 11998001574,
		    "fsType": "xfs",
		    "fsUsed": 11904860828,
		    "id": "WDC_WD120EDAZ-11F3RA0_5PJRD45C",
		    "idx": 2,
		    "name": "disk2",
		    "numErrors": 0,
		    "numReads": 0,
		    "numWrites": 0,
		    "rotational": true,
		    "size": 11718885324,
		    "status": "DISK_OK",
		    "temp": 30,
		    "transport": "ata",
		    "type": "Data",
		    "warning": null,
		  },
		  {
		    "comment": "",
		    "critical": null,
		    "device": "sde",
		    "exportable": false,
		    "format": "GPT: 4KiB-aligned",
		    "fsFree": 5519945093,
		    "fsSize": 11998001574,
		    "fsType": "xfs",
		    "fsUsed": 6478056481,
		    "id": "WDC_WD120EMAZ-11BLFA0_5PH8BTYD",
		    "idx": 3,
		    "name": "disk3",
		    "numErrors": 0,
		    "numReads": 0,
		    "numWrites": 0,
		    "rotational": true,
		    "size": 11718885324,
		    "status": "DISK_OK",
		    "temp": 30,
		    "transport": "ata",
		    "type": "Data",
		    "warning": null,
		  },
		  {
		    "comment": "",
		    "critical": null,
		    "device": "sdi",
		    "exportable": false,
		    "format": "MBR: 4KiB-aligned",
		    "fsFree": 111810683,
		    "fsSize": 250059317,
		    "fsType": "btrfs",
		    "fsUsed": 137273827,
		    "id": "Samsung_SSD_850_EVO_250GB_S2R5NX0H643734Z",
		    "idx": 30,
		    "name": "cache",
		    "numErrors": 0,
		    "numReads": 0,
		    "numWrites": 0,
		    "rotational": false,
		    "size": 244198552,
		    "status": "DISK_OK",
		    "temp": 22,
		    "transport": "ata",
		    "type": "Cache",
		    "warning": null,
		  },
		  {
		    "comment": null,
		    "critical": null,
		    "device": "nvme0n1",
		    "exportable": false,
		    "format": "MBR: 4KiB-aligned",
		    "fsFree": null,
		    "fsSize": null,
		    "fsType": null,
		    "fsUsed": null,
		    "id": "KINGSTON_SA2000M8250G_50026B7282669D9E",
		    "idx": 31,
		    "name": "cache2",
		    "numErrors": 0,
		    "numReads": 0,
		    "numWrites": 0,
		    "rotational": false,
		    "size": 244198552,
		    "status": "DISK_OK",
		    "temp": 27,
		    "transport": "nvme",
		    "type": "Cache",
		    "warning": null,
		  },
		  {
		    "comment": "Unraid OS boot device",
		    "critical": null,
		    "device": "sda",
		    "exportable": true,
		    "format": "unknown",
		    "fsFree": 3191407,
		    "fsSize": 4042732,
		    "fsType": "vfat",
		    "fsUsed": 851325,
		    "id": "Cruzer",
		    "idx": 32,
		    "name": "flash",
		    "numErrors": 0,
		    "numReads": 0,
		    "numWrites": 0,
		    "rotational": true,
		    "size": 3956700,
		    "status": "DISK_OK",
		    "temp": null,
		    "transport": "usb",
		    "type": "Flash",
		    "warning": null,
		  },
		]
	`);
	expect(shares).toMatchInlineSnapshot(`
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
		    "free": 9309372,
		    "include": [],
		    "luksStatus": "0",
		    "name": "appdata",
		    "nameOrig": "appdata",
		    "size": 0,
		    "splitLevel": "",
		    "used": 33619300,
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
		    "free": 9309372,
		    "include": [],
		    "luksStatus": "0",
		    "name": "domains",
		    "nameOrig": "domains",
		    "size": 0,
		    "splitLevel": "1",
		    "used": 33619300,
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
		    "free": 9309372,
		    "include": [],
		    "luksStatus": "0",
		    "name": "isos",
		    "nameOrig": "isos",
		    "size": 0,
		    "splitLevel": "",
		    "used": 33619300,
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
		    "free": 9309372,
		    "include": [],
		    "luksStatus": "0",
		    "name": "system",
		    "nameOrig": "system",
		    "size": 0,
		    "splitLevel": "1",
		    "used": 33619300,
		  },
		]
	`);
	expect(nfsShares).toMatchInlineSnapshot(`
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
	expect(smbShares).toMatchInlineSnapshot(`
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
	expect(users).toMatchInlineSnapshot(`
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
	expect(varState).toMatchInlineSnapshot(`
		{
		  "bindMgt": false,
		  "cacheNumDevices": NaN,
		  "cacheSbNumDisks": NaN,
		  "comment": "Dev Server",
		  "configState": "yes",
		  "configValid": true,
		  "csrfToken": "0000000000000000",
		  "defaultFsType": "xfs",
		  "deviceCount": 4,
		  "domain": "",
		  "domainLogin": "Administrator",
		  "domainShort": "",
		  "enableFruit": "no",
		  "flashGuid": "0000-0000-0000-000000000000",
		  "flashProduct": "DataTraveler_3.0",
		  "flashVendor": "KINGSTON",
		  "fsCopyPrcnt": 0,
		  "fsNumMounted": 0,
		  "fsNumUnmountable": 0,
		  "fsProgress": "Autostart disabled",
		  "fsState": "Stopped",
		  "fsUnmountableMask": "",
		  "fuseDirectio": "auto",
		  "fuseDirectioDefault": "auto",
		  "fuseDirectioStatus": "default",
		  "fuseRemember": "330",
		  "fuseRememberDefault": "330",
		  "fuseRememberStatus": "default",
		  "fuseUseino": "yes",
		  "hideDotFiles": false,
		  "joinStatus": "Not joined",
		  "localMaster": true,
		  "localTld": "local",
		  "luksKeyfile": "/tmp/unraid/keyfile",
		  "maxArraysz": 30,
		  "maxCachesz": 30,
		  "mdColor": "green-blink",
		  "mdNumDisabled": 1,
		  "mdNumDisks": 4,
		  "mdNumErased": 0,
		  "mdNumInvalid": 1,
		  "mdNumMissing": 0,
		  "mdNumNew": 0,
		  "mdNumStripes": 1280,
		  "mdNumStripesDefault": 1280,
		  "mdNumStripesStatus": "default",
		  "mdQueueLimit": "80",
		  "mdQueueLimitDefault": "80",
		  "mdQueueLimitStatus": "default",
		  "mdResync": 0,
		  "mdResyncAction": "check P",
		  "mdResyncCorr": "0",
		  "mdResyncDb": "0",
		  "mdResyncDt": "0",
		  "mdResyncPos": 0,
		  "mdResyncSize": 438960096,
		  "mdScheduler": "auto",
		  "mdSchedulerDefault": "auto",
		  "mdSchedulerStatus": "default",
		  "mdState": "STOPPED",
		  "mdSyncLimit": "5",
		  "mdSyncLimitDefault": "5",
		  "mdSyncLimitStatus": "default",
		  "mdSyncThresh": NaN,
		  "mdSyncThreshDefault": NaN,
		  "mdSyncWindow": NaN,
		  "mdSyncWindowDefault": NaN,
		  "mdVersion": "2.9.14",
		  "mdWriteMethod": NaN,
		  "mdWriteMethodDefault": "auto",
		  "mdWriteMethodStatus": "default",
		  "name": "Tower",
		  "nrRequests": NaN,
		  "nrRequestsDefault": NaN,
		  "nrRequestsStatus": "default",
		  "ntpServer1": "time1.google.com",
		  "ntpServer2": "time2.google.com",
		  "ntpServer3": "time3.google.com",
		  "ntpServer4": "time4.google.com",
		  "pollAttributes": "1800",
		  "pollAttributesDefault": "1800",
		  "pollAttributesStatus": "default",
		  "port": 80,
		  "portssh": 22,
		  "portssl": 443,
		  "porttelnet": 23,
		  "queueDepth": "auto",
		  "regCheck": "Valid",
		  "regFile": "/app/dev/Unraid.net/Pro.key",
		  "regGen": "0",
		  "regGuid": "13FE-4200-C300-58C372A52B19",
		  "regState": "PRO",
		  "regTm": "1833409182",
		  "regTm2": "0",
		  "regTo": "Eli Bosley",
		  "regTy": "PRO",
		  "reservedNames": "parity,parity2,parity3,diskP,diskQ,diskR,disk,disks,flash,boot,user,user0,disk0,disk1,disk2,disk3,disk4,disk5,disk6,disk7,disk8,disk9,disk10,disk11,disk12,disk13,disk14,disk15,disk16,disk17,disk18,disk19,disk20,disk21,disk22,disk23,disk24,disk25,disk26,disk27,disk28,disk29,disk30,disk31",
		  "safeMode": false,
		  "sbClean": true,
		  "sbEvents": 173,
		  "sbName": "/boot/config/super.dat",
		  "sbNumDisks": 5,
		  "sbState": "1",
		  "sbSyncErrs": 0,
		  "sbSyncExit": "0",
		  "sbSynced": 1586819259,
		  "sbSynced2": 1586822456,
		  "sbUpdated": "1596079143",
		  "sbVersion": "2.9.13",
		  "security": "user",
		  "shareAvahiEnabled": true,
		  "shareAvahiSmbModel": "Xserve",
		  "shareAvahiSmbName": "%h",
		  "shareCacheEnabled": true,
		  "shareCacheFloor": "2000000",
		  "shareCount": 0,
		  "shareDisk": "yes",
		  "shareInitialGroup": "Domain Users",
		  "shareInitialOwner": "Administrator",
		  "shareMoverActive": false,
		  "shareMoverLogging": false,
		  "shareMoverSchedule": "40 3 * * *",
		  "shareNfsCount": 0,
		  "shareNfsEnabled": false,
		  "shareSmbCount": 1,
		  "shareSmbEnabled": true,
		  "shareSmbMode": "workgroup",
		  "shareUser": "e",
		  "shareUserExclude": "",
		  "shareUserInclude": "",
		  "shfsLogging": "1",
		  "shutdownTimeout": 90,
		  "spindownDelay": 0,
		  "spinupGroups": false,
		  "startArray": false,
		  "startMode": "Normal",
		  "startPage": "Main",
		  "sysArraySlots": 24,
		  "sysCacheSlots": NaN,
		  "sysFlashSlots": 1,
		  "sysModel": "Dell R710",
		  "timeZone": "Australia/Adelaide",
		  "useNetbios": "yes",
		  "useNtp": true,
		  "useSsh": true,
		  "useSsl": null,
		  "useTelnet": true,
		  "useUpnp": true,
		  "useWsd": "no",
		  "version": "6.11.2",
		  "workgroup": "WORKGROUP",
		  "wsdOpt": "",
		}
	`);
});
