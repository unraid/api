import 'reflect-metadata';

import { cloneDeep } from 'lodash-es';
import { expect, test } from 'vitest';

import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer.js';
import { initialState } from '@app/store/modules/config.js';

test('it creates a FLASH config with NO OPTIONAL values', () => {
    const basicConfig = initialState;
    const config = getWriteableConfig(basicConfig, 'flash');
    expect(config).toMatchInlineSnapshot(`
      {
        "api": {
          "extraOrigins": "",
          "version": "",
        },
        "local": {
          "sandbox": "no",
        },
        "remote": {
          "accesstoken": "",
          "apikey": "",
          "avatar": "",
          "dynamicRemoteAccessType": "DISABLED",
          "email": "",
          "idtoken": "",
          "localApiKey": "",
          "refreshtoken": "",
          "regWizTime": "",
          "ssoSubIds": "",
          "upnpEnabled": "",
          "username": "",
          "wanaccess": "",
          "wanport": "",
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
          "extraOrigins": "",
          "version": "",
        },
        "connectionStatus": {
          "minigraph": "PRE_INIT",
          "upnpStatus": "",
        },
        "local": {
          "sandbox": "no",
        },
        "remote": {
          "accesstoken": "",
          "allowedOrigins": "/var/run/unraid-notifications.sock, /var/run/unraid-php.sock, /var/run/unraid-cli.sock, https://connect.myunraid.net, https://connect-staging.myunraid.net, https://dev-my.myunraid.net:4000",
          "apikey": "",
          "avatar": "",
          "dynamicRemoteAccessType": "DISABLED",
          "email": "",
          "idtoken": "",
          "localApiKey": "",
          "refreshtoken": "",
          "regWizTime": "",
          "ssoSubIds": "",
          "upnpEnabled": "",
          "username": "",
          "wanaccess": "",
          "wanport": "",
        },
      }
    `);
});

test('it creates a FLASH config with OPTIONAL values', () => {
    const basicConfig = cloneDeep(initialState);
    // 2fa & t2fa should be ignored
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
          "version": "",
        },
        "local": {
          "sandbox": "no",
        },
        "remote": {
          "accesstoken": "",
          "apikey": "",
          "avatar": "",
          "dynamicRemoteAccessType": "DISABLED",
          "email": "",
          "idtoken": "",
          "localApiKey": "",
          "refreshtoken": "",
          "regWizTime": "",
          "ssoSubIds": "",
          "upnpEnabled": "yes",
          "username": "",
          "wanaccess": "",
          "wanport": "",
        },
      }
    `);
});

test('it creates a MEMORY config with OPTIONAL values', () => {
    const basicConfig = cloneDeep(initialState);
    // 2fa & t2fa should be ignored
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
          "version": "",
        },
        "connectionStatus": {
          "minigraph": "PRE_INIT",
          "upnpStatus": "Turned On",
        },
        "local": {
          "sandbox": "no",
        },
        "remote": {
          "accesstoken": "",
          "allowedOrigins": "/var/run/unraid-notifications.sock, /var/run/unraid-php.sock, /var/run/unraid-cli.sock, https://connect.myunraid.net, https://connect-staging.myunraid.net, https://dev-my.myunraid.net:4000",
          "apikey": "",
          "avatar": "",
          "dynamicRemoteAccessType": "DISABLED",
          "email": "",
          "idtoken": "",
          "localApiKey": "",
          "refreshtoken": "",
          "regWizTime": "",
          "ssoSubIds": "",
          "upnpEnabled": "yes",
          "username": "",
          "wanaccess": "",
          "wanport": "",
        },
      }
    `);
});
