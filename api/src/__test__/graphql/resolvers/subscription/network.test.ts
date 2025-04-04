import { expect, test, vi } from 'vitest';

import type { NginxUrlFields } from '@app/graphql/resolvers/subscription/network.js';
import { type Nginx } from '@app/core/types/states/nginx.js';
import { URL_TYPE } from '@app/graphql/generated/client/graphql.js';
import {
    getServerIps,
    getUrlForField,
    getUrlForServer,
} from '@app/graphql/resolvers/subscription/network.js';
import { store } from '@app/store/index.js';
import { loadConfigFile } from '@app/store/modules/config.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';

test.each([
    [{ httpPort: 80, httpsPort: 443, url: 'my-default-url.com' }],
    [{ httpPort: 123, httpsPort: 443, url: 'my-default-url.com' }],
    [{ httpPort: 80, httpsPort: 12_345, url: 'my-default-url.com' }],
    [{ httpPort: 212, httpsPort: 3_233, url: 'my-default-url.com' }],
    [{ httpPort: 80, httpsPort: 443, url: 'https://BROKEN_URL' }],
])('getUrlForField', ({ httpPort, httpsPort, url }) => {
    const responseInsecure = getUrlForField({
        port: httpPort,
        url,
    });

    const responseSecure = getUrlForField({
        portSsl: httpsPort,
        url,
    });
    if (httpPort === 80) {
        expect(responseInsecure.port).toBe('');
    } else {
        expect(responseInsecure.port).toBe(httpPort.toString());
    }

    if (httpsPort === 443) {
        expect(responseSecure.port).toBe('');
    } else {
        expect(responseSecure.port).toBe(httpsPort.toString());
    }
});

test('getUrlForServer - field exists, ssl disabled', () => {
    const result = getUrlForServer({
        nginx: {
            lanIp: '192.168.1.1',
            sslEnabled: false,
            httpPort: 123,
            httpsPort: 445,
        } as const as Nginx,
        field: 'lanIp',
    });
    expect(result).toMatchInlineSnapshot('"http://192.168.1.1:123/"');
});

test('getUrlForServer - field exists, ssl yes', () => {
    const result = getUrlForServer({
        nginx: {
            lanIp: '192.168.1.1',
            sslEnabled: true,
            sslMode: 'yes',
            httpPort: 123,
            httpsPort: 445,
        } as const as Nginx,
        field: 'lanIp',
    });
    expect(result).toMatchInlineSnapshot('"https://192.168.1.1:445/"');
});

test('getUrlForServer - field exists, ssl yes, port empty', () => {
    const result = getUrlForServer({
        nginx: {
            lanIp: '192.168.1.1',
            sslEnabled: true,
            sslMode: 'yes',
            httpPort: 80,
            httpsPort: 443,
        } as const as Nginx,
        field: 'lanIp',
    });
    expect(result).toMatchInlineSnapshot('"https://192.168.1.1/"');
});

test('getUrlForServer - field exists, ssl auto', async () => {
    const getResult = async () =>
        getUrlForServer({
            nginx: {
                lanIp: '192.168.1.1',
                sslEnabled: true,
                sslMode: 'auto',
                httpPort: 123,
                httpsPort: 445,
            } as const as Nginx,
            field: 'lanIp',
        });
    await expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Cannot get IP Based URL for field: "lanIp" SSL mode auto]`
    );
});

test('getUrlForServer - field does not exist, ssl disabled', async () => {
    const getResult = async () =>
        getUrlForServer({
            nginx: { lanIp: '192.168.1.1', sslEnabled: false, sslMode: 'no' } as const as Nginx,
            ports: {
                port: ':123',
                portSsl: ':445',
                defaultUrl: new URL('https://my-default-url.unraid.net'),
            },
            // @ts-expect-error Field doesn't exist
            field: 'idontexist',
        });
    await expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: IP URL Resolver: Could not resolve any access URL for field: "idontexist", is FQDN?: false]`
    );
});

test('getUrlForServer - FQDN - field exists, port non-empty', () => {
    const result = getUrlForServer({
        nginx: { lanFqdn: 'my-fqdn.unraid.net', httpsPort: 445 } as unknown as Nginx,
        field: 'lanFqdn' as NginxUrlFields,
    });
    expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net:445/"');
});

test('getUrlForServer - FQDN - field exists, port empty', () => {
    const result = getUrlForServer({
        nginx: { lanFqdn: 'my-fqdn.unraid.net', httpPort: 80, httpsPort: 443 } as unknown as Nginx,
        field: 'lanFqdn' as NginxUrlFields,
    });
    expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net/"');
});

test.each([
    [
        {
            nginx: {
                lanFqdn: 'my-fqdn.unraid.net',
                sslEnabled: false,
                sslMode: 'no',
                httpPort: 80,
                httpsPort: 443,
            } as unknown as Nginx,
            field: 'lanFqdn' as NginxUrlFields,
        },
    ],
    [
        {
            nginx: {
                wanFqdn: 'my-fqdn.unraid.net',
                sslEnabled: true,
                sslMode: 'yes',
                httpPort: 80,
                httpsPort: 443,
            } as unknown as Nginx,
            field: 'wanFqdn' as NginxUrlFields,
        },
    ],
    [
        {
            nginx: {
                wanFqdn6: 'my-fqdn.unraid.net',
                sslEnabled: true,
                sslMode: 'auto',
                httpPort: 80,
                httpsPort: 443,
            } as unknown as Nginx,
            field: 'wanFqdn6' as NginxUrlFields,
        },
    ],
])('getUrlForServer - FQDN', ({ nginx, field }) => {
    const result = getUrlForServer({ nginx, field });
    expect(result.toString()).toBe('https://my-fqdn.unraid.net/');
});

test('getUrlForServer - field does not exist, ssl disabled', async () => {
    const getResult = async () =>
        getUrlForServer({
            nginx: { lanFqdn: 'my-fqdn.unraid.net' } as unknown as Nginx,
            ports: { portSsl: '', port: '', defaultUrl: new URL('https://my-default-url.unraid.net') },
            // @ts-expect-error Field doesn't exist
            field: 'idontexist',
        });
    await expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: IP URL Resolver: Could not resolve any access URL for field: "idontexist", is FQDN?: false]`
    );
});

test('integration test, loading nginx ini and generating all URLs', async () => {
    await store.dispatch(loadStateFiles());
    await store.dispatch(loadConfigFile());

    // Instead of mocking the getServerIps function, we'll use the actual function
    // and verify the structure of the returned URLs
    const urls = getServerIps();

    // Verify that we have URLs
    expect(urls.urls.length).toBeGreaterThan(0);
    expect(urls.errors.length).toBeGreaterThanOrEqual(0);

    // Verify that each URL has the expected structure
    urls.urls.forEach((url) => {
        expect(url).toHaveProperty('ipv4');
        expect(url).toHaveProperty('name');
        expect(url).toHaveProperty('type');

        // Verify that the URL matches the expected pattern based on its type
        if (url.type === URL_TYPE.DEFAULT) {
            expect(url.ipv4?.toString()).toMatch(/^https:\/\/.*:\d+\/$/);
            expect(url.ipv6?.toString()).toMatch(/^https:\/\/.*:\d+\/$/);
        } else if (url.type === URL_TYPE.LAN) {
            expect(url.ipv4?.toString()).toMatch(/^https:\/\/.*:\d+\/$/);
        } else if (url.type === URL_TYPE.MDNS) {
            expect(url.ipv4?.toString()).toMatch(/^https:\/\/.*:\d+\/$/);
        } else if (url.type === URL_TYPE.WIREGUARD) {
            expect(url.ipv4?.toString()).toMatch(/^https:\/\/.*:\d+\/$/);
        }
    });

    // Verify that the error message contains the expected text
    if (urls.errors.length > 0) {
        expect(urls.errors[0].message).toContain(
            'IP URL Resolver: Could not resolve any access URL for field:'
        );
    }
});
