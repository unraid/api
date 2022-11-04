import { test, expect, vi } from 'vitest';

// Preloading imports for faster tests
import '@app/store/sync/array-sync';

vi.mock('@app/core/pubsub', () => ({
	pubsub: { publish: vi.fn() },
}));

test('Creates an array event', async () => {
	const { createArrayEvent } = await import('@app/store/sync/array-sync');
	const { store } = await import('@app/store');
	const { loadStateFiles } = await import('@app/store/modules/emhttp');

	// Load state files into store
	await store.dispatch(loadStateFiles());

	const state = store.getState();
	const arrayEvent = createArrayEvent(state);
	expect(arrayEvent).toMatchInlineSnapshot(`
		{
		  "array": {
		    "boot": {
		      "color": "green-on",
		      "comment": "Unraid OS boot device",
		      "device": "sda",
		      "exportable": false,
		      "floor": "0",
		      "format": "unknown",
		      "fsColor": "yellow_on",
		      "fsFree": 6685884,
		      "fsSize": 7578136,
		      "fsStatus": "Mounted",
		      "fsType": "vfat",
		      "id": "DataTraveler_3.0",
		      "idx": "31",
		      "name": "flash",
		      "numErrors": 0,
		      "numReads": 184,
		      "numWrites": 72,
		      "rotational": false,
		      "size": 7593952,
		      "sizeSb": NaN,
		      "status": "DISK_OK",
		      "temp": NaN,
		      "type": "Flash",
		    },
		    "caches": [],
		    "capacity": {
		      "bytes": {
		        "free": "0",
		        "total": "0",
		        "used": "0",
		      },
		      "disks": {
		        "free": "27",
		        "total": "30",
		        "used": "3",
		      },
		    },
		    "disks": [
		      {
		        "color": "green-on",
		        "comment": "",
		        "device": "sde",
		        "deviceSb": "md1",
		        "exportable": false,
		        "floor": "0",
		        "format": "MBR: 4KiB-aligned",
		        "fsColor": "grey_off",
		        "fsFree": 0,
		        "fsSize": 0,
		        "fsStatus": "-",
		        "fsType": "xfs",
		        "id": "PERC_6_i_00c970383c4dcf842300e7a766b0b242_36842b2b066a7e7002384cf4d3c3870c9",
		        "idSb": "PERC_6_i_00c970383c4dcf842300e7a766b0b242_36842b2b066a7e7002384cf4d3c3870c9",
		        "idx": "1",
		        "luksState": "0",
		        "name": "disk1",
		        "numErrors": 0,
		        "numReads": 1391478,
		        "numWrites": 0,
		        "rotational": true,
		        "size": 438960096,
		        "sizeSb": 438960096,
		        "smType": "",
		        "spindownDelay": "-1",
		        "spinupGroup": "host1",
		        "status": "DISK_OK",
		        "temp": NaN,
		        "type": "Data",
		      },
		      {
		        "color": "green-on",
		        "comment": "",
		        "device": "sdd",
		        "deviceSb": "md2",
		        "exportable": false,
		        "floor": "0",
		        "format": "MBR: 4KiB-aligned",
		        "fsColor": "grey_off",
		        "fsFree": 0,
		        "fsSize": 0,
		        "fsStatus": "-",
		        "fsType": "xfs",
		        "id": "PERC_6_i_0062a4dc3b47cf842300e7a766b0b242_36842b2b066a7e7002384cf473bdca462",
		        "idSb": "PERC_6_i_0062a4dc3b47cf842300e7a766b0b242_36842b2b066a7e7002384cf473bdca462",
		        "idx": "2",
		        "luksState": "0",
		        "name": "disk2",
		        "numErrors": 0,
		        "numReads": 1391478,
		        "numWrites": 0,
		        "rotational": true,
		        "size": 438960096,
		        "sizeSb": 438960096,
		        "smType": "",
		        "spindownDelay": "-1",
		        "spinupGroup": "host1",
		        "status": "DISK_OK",
		        "temp": NaN,
		        "type": "Data",
		      },
		      {
		        "color": "green-on",
		        "comment": "",
		        "device": "sdc",
		        "deviceSb": "md3",
		        "exportable": false,
		        "floor": "0",
		        "format": "MBR: 4KiB-aligned",
		        "fsColor": "grey_off",
		        "fsFree": 0,
		        "fsSize": 0,
		        "fsStatus": "-",
		        "fsType": "xfs",
		        "id": "PERC_6_i_007142123a29cf842300e7a766b0b242_36842b2b066a7e7002384cf293a124271",
		        "idSb": "PERC_6_i_007142123a29cf842300e7a766b0b242_36842b2b066a7e7002384cf293a124271",
		        "idx": "3",
		        "luksState": "0",
		        "name": "disk3",
		        "numErrors": 0,
		        "numReads": 1391478,
		        "numWrites": 0,
		        "rotational": true,
		        "size": 438960096,
		        "sizeSb": 438960096,
		        "smType": "",
		        "spindownDelay": "-1",
		        "spinupGroup": "host1",
		        "status": "DISK_OK",
		        "temp": NaN,
		        "type": "Data",
		      },
		    ],
		    "parities": [
		      {
		        "color": "green-on",
		        "device": "sdb",
		        "deviceSb": "",
		        "exportable": false,
		        "format": "MBR: 4KiB-aligned",
		        "fsColor": undefined,
		        "fsFree": NaN,
		        "fsSize": NaN,
		        "id": "PERC_6_i_001ea67735dcce842300e7a766b0b242_36842b2b066a7e7002384cedc3577a61e",
		        "idSb": "PERC_6_i_001ea67735dcce842300e7a766b0b242_36842b2b066a7e7002384cedc3577a61e",
		        "idx": "0",
		        "name": "parity",
		        "numErrors": 0,
		        "numReads": 1391469,
		        "numWrites": 0,
		        "rotational": true,
		        "size": 438960096,
		        "sizeSb": 438960096,
		        "smType": "",
		        "spindownDelay": "-1",
		        "spinupGroup": "host1",
		        "status": "DISK_OK",
		        "temp": NaN,
		        "type": "Parity",
		      },
		    ],
		    "state": "stopped",
		  },
		}
	`);
});
