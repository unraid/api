import { expect, test } from 'vitest';
import { type Nginx } from '../../../../core/types/states/nginx';
import { getUrlForField, getUrlForServer, getServerIps, type NginxUrlFields } from '@app/graphql/resolvers/subscription/network';
import { store } from '@app/store';
import { loadStateFiles } from '@app/store/modules/emhttp';
import { loadConfigFile } from '@app/store/modules/config';

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
	const result = getUrlForServer({ nginx: { lanIp: '192.168.1.1', sslEnabled: false, httpPort: 123, httpsPort: 445 } as const as Nginx,
		field: 'lanIp',
	});
	expect(result).toMatchInlineSnapshot('"http://192.168.1.1:123/"');
});

test('getUrlForServer - field exists, ssl yes', () => {
	const result = getUrlForServer({
		nginx: { lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes', httpPort: 123, httpsPort: 445 } as const as Nginx,
		field: 'lanIp',
	});
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1:445/"');
});

test('getUrlForServer - field exists, ssl yes, port empty', () => {
	const result = getUrlForServer(
		{ nginx: { lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes', httpPort: 80, httpsPort: 443 } as const as Nginx,
			field: 'lanIp',
		});
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1/"');
});

test('getUrlForServer - field exists, ssl auto', () => {
	const getResult = async () => getUrlForServer({
		nginx: { lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'auto', httpPort: 123, httpsPort: 445 } as const as Nginx,
		field: 'lanIp',
	});
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot get IP Based URL for field: \\"lanIp\\" SSL mode auto"');
});

test('getUrlForServer - field does not exist, ssl disabled', () => {
	const getResult = async () => getUrlForServer(
		{
			nginx: { lanIp: '192.168.1.1', sslEnabled: false, sslMode: 'no' } as const as Nginx,
			ports: {
				port: ':123', portSsl: ':445', defaultUrl: new URL('https://my-default-url.unraid.net'),
			},
			// @ts-expect-error Field doesn't exist
			field: 'idontexist',
		});
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"IP URL Resolver: Could not resolve any access URL for field: \\"idontexist\\", is FQDN?: false"');
});

test('getUrlForServer - FQDN - field exists, port non-empty', () => {
	const result = getUrlForServer({
		nginx: { lanFqdn: 'my-fqdn.unraid.net', httpsPort: 445 } as const as Nginx,
		field: 'lanFqdn',
	});
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net:445/"');
});

test('getUrlForServer - FQDN - field exists, port empty', () => {
	const result = getUrlForServer({ nginx: { lanFqdn: 'my-fqdn.unraid.net', httpPort: 80, httpsPort: 443 } as const as Nginx,
		field: 'lanFqdn',
	});
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net/"');
});

test.each([
	[{ nginx: { lanFqdn: 'my-fqdn.unraid.net', sslEnabled: false, sslMode: 'no' } as const as Nginx, field: 'lanFqdn' as NginxUrlFields }],
	[{ nginx: { wanFqdn: 'my-fqdn.unraid.net', sslEnabled: true, sslMode: 'yes' } as const as Nginx, field: 'wanFqdn' as NginxUrlFields }],
	[{ nginx: { wanFqdn6: 'my-fqdn.unraid.net', sslEnabled: true, sslMode: 'auto' } as const as Nginx, field: 'wanFqdn6' as NginxUrlFields }],

])('getUrlForServer - FQDN', ({ nginx, field }) => {
	const result = getUrlForServer({ nginx, field });
	expect(result.toString()).toBe('https://my-fqdn.unraid.net/');
});

test('getUrlForServer - field does not exist, ssl disabled', () => {
	const getResult = async () => getUrlForServer({ nginx:
		{ lanFqdn: 'my-fqdn.unraid.net' } as const as Nginx,
	ports: { portSsl: '', port: '', defaultUrl: new URL('https://my-default-url.unraid.net') },
	// @ts-expect-error Field doesn't exist
	field: 'idontexist' });
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"IP URL Resolver: Could not resolve any access URL for field: \\"idontexist\\", is FQDN?: false"');
});

test('integration test, loading nginx ini and generating all URLs', async () => {
	await store.dispatch(loadStateFiles());
	await store.dispatch(loadConfigFile());

	const urls = getServerIps();
	expect(urls.urls).toMatchInlineSnapshot(`
		[
		  {
		    "ipv4": "https://tower.local:4443/",
		    "ipv6": "https://tower.local:4443/",
		    "name": "Default",
		    "type": "DEFAULT",
		  },
		  {
		    "ipv4": "https://192.168.1.150:4443/",
		    "name": "LAN IPv4",
		    "type": "LAN",
		  },
		  {
		    "ipv4": "https://tower:4443/",
		    "name": "LAN Name",
		    "type": "MDNS",
		  },
		  {
		    "ipv4": "https://tower.local:4443/",
		    "name": "LAN MDNS",
		    "type": "MDNS",
		  },
		  {
		    "ipv4": "https://192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net:4443/",
		    "name": "LAN FQDN",
		    "type": "LAN",
		  },
		  {
		    "ipv4": "https://85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net:8443/",
		    "name": "WAN FQDN",
		    "type": "WAN",
		  },
		  {
		    "ipv4": "https://10-252-0-1.hash.myunraid.net:4443/",
		    "name": "WG FQDN 0",
		    "type": "WIREGUARD",
		  },
		  {
		    "ipv4": "https://10-252-1-1.hash.myunraid.net:4443/",
		    "name": "WG FQDN 1",
		    "type": "WIREGUARD",
		  },
		  {
		    "ipv4": "https://10-253-3-1.hash.myunraid.net:4443/",
		    "name": "WG FQDN 3",
		    "type": "WIREGUARD",
		  },
		  {
		    "ipv4": "https://10-253-4-1.hash.myunraid.net:4443/",
		    "name": "WG FQDN 4",
		    "type": "WIREGUARD",
		  },
		  {
		    "ipv4": "https://10-253-5-1.hash.myunraid.net:4443/",
		    "name": "WG FQDN 55",
		    "type": "WIREGUARD",
		  },
		]
	`);
	expect(urls.errors).toMatchInlineSnapshot(`
		[
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "lanIp6", is FQDN?: false],
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "lanFqdn6", is FQDN?: true],
		  [Error: Failed to parse URL: https://:8443],
		]
	`);
});
