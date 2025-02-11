import { getAllowedOrigins } from '@app/common/allowed-origins';
import { store } from '@app/store/index';
import { loadConfigFile } from '@app/store/modules/config';
import { loadStateFiles } from '@app/store/modules/emhttp';

import 'reflect-metadata';

import { expect, test } from 'vitest';

test('Returns allowed origins', async () => {
    // Load state files into store
    await store.dispatch(loadStateFiles());
    await store.dispatch(loadConfigFile());

    // Get allowed origins
    expect(getAllowedOrigins()).toMatchInlineSnapshot(`
      [
        "/var/run/unraid-notifications.sock",
        "/var/run/unraid-php.sock",
        "/var/run/unraid-cli.sock",
        "http://localhost:8080",
        "https://localhost:4443",
        "https://tower.local:4443",
        "https://192.168.1.150:4443",
        "https://tower:4443",
        "https://192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net:4443",
        "https://85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net:8443",
        "https://10-252-0-1.hash.myunraid.net:4443",
        "https://10-252-1-1.hash.myunraid.net:4443",
        "https://10-253-3-1.hash.myunraid.net:4443",
        "https://10-253-4-1.hash.myunraid.net:4443",
        "https://10-253-5-1.hash.myunraid.net:4443",
        "https://10-100-0-1.hash.myunraid.net:4443",
        "https://10-100-0-2.hash.myunraid.net:4443",
        "https://10-123-1-2.hash.myunraid.net:4443",
        "https://221-123-121-112.hash.myunraid.net:4443",
        "https://google.com",
        "https://test.com",
        "https://connect.myunraid.net",
        "https://connect-staging.myunraid.net",
        "https://dev-my.myunraid.net:4000",
      ]
    `);
});
