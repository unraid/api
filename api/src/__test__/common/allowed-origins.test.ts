import { getAllowedOrigins } from '@app/common/allowed-origins.js';
import { store } from '@app/store/index.js';
import { loadConfigFile } from '@app/store/modules/config.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';

import 'reflect-metadata';

import { expect, test } from 'vitest';

test('Returns allowed origins', async () => {
    // Load state files into store
    await store.dispatch(loadStateFiles()).unwrap();
    await store.dispatch(loadConfigFile()).unwrap();

    // Get allowed origins
    const allowedOrigins = getAllowedOrigins();

    // Test that the result is an array
    expect(Array.isArray(allowedOrigins)).toBe(true);

    // Test that it contains the expected socket paths
    expect(allowedOrigins).toContain('/var/run/unraid-notifications.sock');
    expect(allowedOrigins).toContain('/var/run/unraid-php.sock');
    expect(allowedOrigins).toContain('/var/run/unraid-cli.sock');

    // Test that it contains the expected local URLs
    expect(allowedOrigins).toContain('http://localhost:8080');
    expect(allowedOrigins).toContain('https://localhost:4443');

    // Test that it contains the expected connect URLs
    expect(allowedOrigins).toContain('https://connect.myunraid.net');
    expect(allowedOrigins).toContain('https://connect-staging.myunraid.net');
    expect(allowedOrigins).toContain('https://dev-my.myunraid.net:4000');

    // Test that it contains the extra origins from config
    expect(allowedOrigins).toContain('https://google.com');
    expect(allowedOrigins).toContain('https://test.com');

    // Test that it contains some of the remote URLs
    expect(allowedOrigins).toContain('https://tower.local:4443');
    expect(allowedOrigins).toContain('https://192.168.1.150:4443');

    // Test that there are no duplicates
    expect(allowedOrigins.length).toBe(new Set(allowedOrigins).size);
});
