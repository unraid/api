import { join } from 'path';

import { expect, test } from 'vitest';

import type { VarIni } from '@app/store/state-parsers/var';
import { store } from '@app/store';

test('Returns parsed state file', async () => {
    const { parse } = await import('@app/store/state-parsers/var');
    const { parseConfig } = await import('@app/core/utils/misc/parse-config');
    const { paths } = store.getState();
    const filePath = join(paths.states, 'var.ini');
    const stateFile = parseConfig<VarIni>({
        filePath,
        type: 'ini',
    });

    expect(parse(stateFile)).toMatchInlineSnapshot(`
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
		  "regExp": "",
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
