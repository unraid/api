import { resolve as resolvePath } from 'path';
import { test, expect } from 'vitest';
import { store } from '@app/store';

const devConfigPath = resolvePath(__dirname, '../../../../dev/Unraid.net/myservers.cfg');

test('Before init returns default values for all fields', async () => {
	const state = store.getState().config;
	expect(state).toMatchInlineSnapshot(`
		{
		  "api": {
		    "extraOrigins": "",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "connectionStatus": {
		    "minigraph": "disconnected",
		    "relay": "disconnected",
		  },
		  "local": {
		    "2Fa": "",
		    "showT2Fa": "",
		  },
		  "nodeEnv": "test",
		  "notifier": {
		    "apikey": "",
		  },
		  "remote": {
		    "2Fa": "",
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
		  "status": "UNLOADED",
		  "upc": {
		    "apikey": "",
		  },
		}
	`);
}, 10_000);

test('After init returns values from cfg file for all fields', async () => {
	const { loadConfigFile } = await import('@app/store/modules/config');

	// Load cfg into store
	await store.dispatch(loadConfigFile(devConfigPath));

	// Check if store has cfg contents loaded
	const state = store.getState().config;
	expect(state).toMatchInlineSnapshot(`
		{
		  "api": {
		    "extraOrigins": "",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "connectionStatus": {
		    "minigraph": "disconnected",
		    "relay": "disconnected",
		  },
		  "local": {
		    "2Fa": "",
		    "showT2Fa": "",
		  },
		  "nodeEnv": "test",
		  "notifier": {
		    "apikey": "unnotify_675cd11051f572ee83a5ce3400b9fb4d6518763c34ce2dc9d2384ba",
		  },
		  "remote": {
		    "2Fa": "",
		    "accesstoken": "",
		    "apikey": "_______________________BIG_API_KEY_HERE_________________________",
		    "avatar": "https://via.placeholder.com/200",
		    "email": "test@example.com",
		    "event": "REG_WIZARD",
		    "idtoken": "",
		    "keyfile": "_____________________EVEN_BIGGER_KEY_HERE_________________________",
		    "license": "",
		    "refreshtoken": "",
		    "regWizTime": "1611175408732_0951-1653-3509-FBA155FA23C0",
		    "username": "zspearmint",
		    "wanaccess": "no",
		    "wanport": "8443",
		  },
		  "status": "LOADED",
		  "upc": {
		    "apikey": "unupc_5239e6c0cd18221202174e80b56ded12956b700b92bea1b529836b4d3c",
		  },
		}
	`);
});

test('updateUserConfig merges in changes to current state', async () => {
	const { loadConfigFile, updateUserConfig } = await import('@app/store/modules/config');

	// Load cfg into store
	await store.dispatch(loadConfigFile(devConfigPath));

	// Update store
	store.dispatch(updateUserConfig({ remote: { avatar: 'https://via.placeholder.com/500' } }));

	const state = store.getState().config;
	expect(state).toMatchInlineSnapshot(`
		{
		  "api": {
		    "extraOrigins": "",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "connectionStatus": {
		    "minigraph": "disconnected",
		    "relay": "disconnected",
		  },
		  "local": {
		    "2Fa": "",
		    "showT2Fa": "",
		  },
		  "nodeEnv": "test",
		  "notifier": {
		    "apikey": "unnotify_675cd11051f572ee83a5ce3400b9fb4d6518763c34ce2dc9d2384ba",
		  },
		  "remote": {
		    "2Fa": "",
		    "accesstoken": "",
		    "apikey": "_______________________BIG_API_KEY_HERE_________________________",
		    "avatar": "https://via.placeholder.com/500",
		    "email": "test@example.com",
		    "event": "REG_WIZARD",
		    "idtoken": "",
		    "keyfile": "_____________________EVEN_BIGGER_KEY_HERE_________________________",
		    "license": "",
		    "refreshtoken": "",
		    "regWizTime": "1611175408732_0951-1653-3509-FBA155FA23C0",
		    "username": "zspearmint",
		    "wanaccess": "no",
		    "wanport": "8443",
		  },
		  "status": "LOADED",
		  "upc": {
		    "apikey": "unupc_5239e6c0cd18221202174e80b56ded12956b700b92bea1b529836b4d3c",
		  },
		}
	`);
});

/*
Test('File on disk matches state after writing', async () => {
	const { loadConfigFile, updateUserConfig, writeConfigToDisk } = await import('@app/store/modules/config');

	// Load cfg into store
	await store.dispatch(loadConfigFile(devConfigPath));

	// Update store
	store.dispatch(updateUserConfig({ remote: { avatar: 'https://via.placeholder.com/500' } }));

	// Update file on disk
	const newConfigFilePath = temporaryFile();
	await store.dispatch(writeConfigToDisk(newConfigFilePath));

	// Check state matches disk
	const newConfigFile = await store.dispatch(loadConfigFile(newConfigFilePath)).unwrap();
	const state = store.getState().config;
	expect(state.api).toEqual(newConfigFile.api);
	expect(state.local).toEqual(newConfigFile.local);
	expect(state.notifier).toEqual(newConfigFile.notifier);
	expect(state.upc).toEqual(newConfigFile.upc);
	expect(state.remote).toEqual(newConfigFile.remote);
});
*/
