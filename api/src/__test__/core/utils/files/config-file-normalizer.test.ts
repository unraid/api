import { test, expect } from 'vitest';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { initialState } from '@app/store/modules/config';
import { cloneDeep } from 'lodash';

test('it creates a FLASH config with NO OPTIONAL values', () => {
	const basicConfig = initialState;
	const config = getWriteableConfig(basicConfig, 'flash');
	expect(config).toMatchInlineSnapshot(`
		{
		  "api": {
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "local": {},
		  "notifier": {
		    "apikey": "",
		  },
		  "remote": {
		    "accesstoken": "",
		    "apikey": "",
		    "avatar": "",
		    "email": "",
		    "idtoken": "",
		    "refreshtoken": "",
		    "regWizTime": "",
		    "username": "",
		    "wanaccess": "",
		    "wanport": "",
		  },
		  "upc": {
		    "apikey": "",
		  },
		}
	`);
});

test('it creates a MEMORY config with NO OPTIONAL values', () => {
	const basicConfig = initialState;
	const config = getWriteableConfig(basicConfig, 'memory');
	expect(config).toMatchInlineSnapshot(`
		{
		  "api": {
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "connectionStatus": {
		    "minigraph": "DISCONNECTED",
		  },
		  "local": {},
		  "notifier": {
		    "apikey": "",
		  },
		  "remote": {
		    "accesstoken": "",
		    "apikey": "",
		    "avatar": "",
		    "email": "",
		    "idtoken": "",
		    "refreshtoken": "",
		    "regWizTime": "",
		    "username": "",
		    "wanaccess": "",
		    "wanport": "",
		  },
		  "upc": {
		    "apikey": "",
		  },
		}
	`);
});

test('it creates a FLASH config with OPTIONAL values', () => {
	const basicConfig = cloneDeep(initialState);
	basicConfig.remote['2Fa'] = 'yes';
	basicConfig.local['2Fa'] = 'yes';
	basicConfig.local.showT2Fa = 'yes';
	basicConfig.api.extraOrigins = 'myextra.origins';
	basicConfig.remote.upnpEnabled = 'yes';
	basicConfig.connectionStatus.upnpStatus = 'Turned On';
	const config = getWriteableConfig(basicConfig, 'flash');
	expect(config).toMatchInlineSnapshot(`
		{
		  "api": {
		    "extraOrigins": "myextra.origins",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "local": {
		    "2Fa": "yes",
		    "showT2Fa": "yes",
		  },
		  "notifier": {
		    "apikey": "",
		  },
		  "remote": {
		    "2Fa": "yes",
		    "accesstoken": "",
		    "apikey": "",
		    "avatar": "",
		    "email": "",
		    "idtoken": "",
		    "refreshtoken": "",
		    "regWizTime": "",
		    "upnpEnabled": "yes",
		    "username": "",
		    "wanaccess": "",
		    "wanport": "",
		  },
		  "upc": {
		    "apikey": "",
		  },
		}
	`);
});

test('it creates a MEMORY config with OPTIONAL values', () => {
	const basicConfig = cloneDeep(initialState);
	basicConfig.remote['2Fa'] = 'yes';
	basicConfig.local['2Fa'] = 'yes';
	basicConfig.local.showT2Fa = 'yes';
	basicConfig.api.extraOrigins = 'myextra.origins';
	basicConfig.remote.upnpEnabled = 'yes';
	basicConfig.connectionStatus.upnpStatus = 'Turned On';
	const config = getWriteableConfig(basicConfig, 'memory');
	expect(config).toMatchInlineSnapshot(`
		{
		  "api": {
		    "extraOrigins": "myextra.origins",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "connectionStatus": {
		    "minigraph": "DISCONNECTED",
		    "upnpError": "Turned On",
		  },
		  "local": {
		    "2Fa": "yes",
		    "showT2Fa": "yes",
		  },
		  "notifier": {
		    "apikey": "",
		  },
		  "remote": {
		    "2Fa": "yes",
		    "accesstoken": "",
		    "apikey": "",
		    "avatar": "",
		    "email": "",
		    "idtoken": "",
		    "refreshtoken": "",
		    "regWizTime": "",
		    "upnpEnabled": "yes",
		    "username": "",
		    "wanaccess": "",
		    "wanport": "",
		  },
		  "upc": {
		    "apikey": "",
		  },
		}
	`);
});
