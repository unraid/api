import { test, expect, vi } from 'vitest';

vi.mock('@app/core/pubsub', () => ({
    pubsub: { publish: vi.fn() },
}));

test('Creates an array event', async () => {
    const { getArrayData } = await import(
        '@app/core/modules/array/get-array-data'
    );
    const { store } = await import('@app/store');
    const { loadStateFiles } = await import('@app/store/modules/emhttp');

    // Load state files into store
    await store.dispatch(loadStateFiles());

    const arrayEvent = getArrayData(store.getState);
    expect(arrayEvent).toMatchInlineSnapshot(`
      {
        "boot": {
          "device": "sda",
          "exportable": true,
          "fsFree": 3116608,
          "fsSize": 3947980,
          "fsUsed": 831372,
          "id": "Cruzer",
          "idx": 32,
          "name": "flash",
          "numErrors": 0,
          "numReads": 24522,
          "numWrites": 26095,
          "rotational": true,
          "size": 3956700,
          "status": "DISK_OK",
          "temp": null,
          "type": "Flash",
        },
        "caches": [
          {
            "device": "sdi",
            "exportable": false,
            "fsFree": 109190120,
            "fsSize": 244198552,
            "fsUsed": 134056472,
            "id": "Samsung_SSD_850_EVO_250GB_S2R5NX0H643734Z",
            "idx": 30,
            "name": "cache",
            "numErrors": 0,
            "numReads": 7751234,
            "numWrites": 72422828,
            "rotational": false,
            "size": 244198552,
            "status": "DISK_OK",
            "temp": 22,
            "type": "Cache",
          },
          {
            "device": "nvme0n1",
            "exportable": false,
            "fsFree": null,
            "fsSize": null,
            "fsUsed": null,
            "id": "KINGSTON_SA2000M8250G_50026B7282669D9E",
            "idx": 31,
            "name": "cache2",
            "numErrors": 0,
            "numReads": 8509208,
            "numWrites": 78986172,
            "rotational": false,
            "size": 244198552,
            "status": "DISK_OK",
            "temp": 27,
            "type": "Cache",
          },
        ],
        "capacity": {
          "disks": {
            "free": "27",
            "total": "30",
            "used": "3",
          },
          "kilobytes": {
            "free": "19038892160",
            "total": "41010494044",
            "used": "21971601884",
          },
        },
        "disks": [
          {
            "device": "sdf",
            "exportable": false,
            "fsFree": 13557363020,
            "fsSize": 17576897220,
            "fsUsed": 4019534200,
            "id": "ST18000NM000J-2TV103_ZR5B1W9X",
            "idx": 1,
            "name": "disk1",
            "numErrors": 0,
            "numReads": 6067048321,
            "numWrites": 761993220,
            "rotational": true,
            "size": 17578328012,
            "status": "DISK_OK",
            "temp": 30,
            "type": "Data",
          },
          {
            "device": "sdj",
            "exportable": false,
            "fsFree": 90957760,
            "fsSize": 11716798412,
            "fsUsed": 11625840652,
            "id": "WDC_WD120EDAZ-11F3RA0_5PJRD45C",
            "idx": 2,
            "name": "disk2",
            "numErrors": 0,
            "numReads": 3178772532,
            "numWrites": 1182939,
            "rotational": true,
            "size": 11718885324,
            "status": "DISK_OK",
            "temp": 30,
            "type": "Data",
          },
          {
            "device": "sde",
            "exportable": false,
            "fsFree": 5390571380,
            "fsSize": 11716798412,
            "fsUsed": 6326227032,
            "id": "WDC_WD120EMAZ-11BLFA0_5PH8BTYD",
            "idx": 3,
            "name": "disk3",
            "numErrors": 0,
            "numReads": 3375865821,
            "numWrites": 269152540,
            "rotational": true,
            "size": 11718885324,
            "status": "DISK_OK",
            "temp": 30,
            "type": "Data",
          },
        ],
        "parities": [
          {
            "device": "sdh",
            "exportable": false,
            "fsFree": null,
            "fsSize": null,
            "fsUsed": null,
            "id": "ST18000NM000J-2TV103_ZR585CPY",
            "idx": 0,
            "name": "parity",
            "numErrors": 0,
            "numReads": 5404086599,
            "numWrites": 1032312047,
            "rotational": true,
            "size": 17578328012,
            "status": "DISK_OK",
            "temp": 25,
            "type": "Parity",
          },
        ],
        "state": "STOPPED",
      }
    `);
});
