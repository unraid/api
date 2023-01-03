import { expect, test } from 'vitest';
import { type Nginx } from '../../../../core/types/states/nginx';
import { getFQDNBasedUrlForServer, getIpBasedUrlForServer, getPortAndDefaultUrl, getServerIps, type PortAndDefaultUrl } from '../../../../graphql/resolvers/subscription/network';
import { store } from '@app/store';
import { loadStateFiles } from '@app/store/modules/emhttp';

test.each([
	[{ httpPort: 80, httpsPort: 443, defaultUrl: 'my-default-url' }],
	[{ httpPort: 123, httpsPort: 443, defaultUrl: 'my-default-url2' }],
	[{ httpPort: 80, httpsPort: 12_345, defaultUrl: 'my-default-url3' }],
	[{ httpPort: 212, httpsPort: 3_233, defaultUrl: 'my-default-url4' }],

])('portAndDefaultUrl', ({ httpPort, httpsPort, defaultUrl }) => {
	const response = getPortAndDefaultUrl({
		httpPort, httpsPort, defaultUrl,
	} as Nginx);

	if (httpPort === 80) {
		expect(response.port).toBe('');
	} else {
		expect(response.port).toBe(`:${httpPort}`);
	}

	if (httpsPort === 443) {
		expect(response.portSsl).toBe('');
	} else {
		expect(response.portSsl).toBe(`:${httpsPort}`);
	}

	expect(response.defaultUrl).toBe(defaultUrl);
});

test('getIpBasedUrlForServer - field exists, ssl disabled', () => {
	const result = getIpBasedUrlForServer(
		{ lanIp: '192.168.1.1', sslEnabled: false } as Nginx,
		{
			port: ':123', portSsl: ':445', defaultUrl: 'hi',
		},
		'lanIp');
	expect(result).toMatchInlineSnapshot('"http://192.168.1.1:123/"');
});

test('getIpBasedUrlForServer - field exists, ssl yes', () => {
	const result = getIpBasedUrlForServer(
		{ lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes' } as Nginx,
		{
			port: ':123', portSsl: ':445', defaultUrl: 'hi',
		},
		'lanIp');
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1:445/"');
});

test('getIpBasedUrlForServer - field exists, ssl yes, port empty', () => {
	const result = getIpBasedUrlForServer(
		{ lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes' } as Nginx,
		{
			port: '', portSsl: '', defaultUrl: 'hi',
		},
		'lanIp');
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1/"');
});

test('getIpBasedUrlForServer - field exists, ssl auto', () => {
	const getResult = async () => getIpBasedUrlForServer(
		{ lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'auto' } as Nginx,
		{
			port: ':123', portSsl: ':445', defaultUrl: 'hi',
		},
		'lanIp');
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot get IP Based URL for field: \\"lanIp\\" SSL mode auto"');
});

test('getIpBasedUrlForServer - field does not exist, ssl disabled', () => {
	const getResult = async () => getIpBasedUrlForServer(
		{ lanIp: '192.168.1.1', sslEnabled: false, sslMode: 'no' } as Nginx,
		{
			port: ':123', portSsl: ':445', defaultUrl: 'hi',
		},
		// @ts-expect-error Field doesn't exist
		'idontexist');
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"IP URL Resolver: Could not resolve any access URL for field: \\"idontexist\\""');
});

test('getFqdnBasedUrlForServer - field exists, port non-empty', () => {
	const result = getFQDNBasedUrlForServer({ lanFqdn: 'my-fqdn.unraid.net' } as Nginx, { portSsl: ':445', port: '', defaultUrl: 'my-default-url.unraid.net' }, 'lanFqdn');
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net:445/"');
});

test('getFqdnBasedUrlForServer - field exists, port empty', () => {
	const result = getFQDNBasedUrlForServer({ lanFqdn: 'my-fqdn.unraid.net' } as Nginx, { portSsl: '', port: '', defaultUrl: 'my-default-url.unraid.net' }, 'lanFqdn');
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net/"');
});

test('getIpBasedUrlForServer - field does not exist, ssl disabled', () => {
	const getResult = async () => getFQDNBasedUrlForServer(
		{ lanFqdn: 'my-fqdn.unraid.net' } as Nginx,
		{ portSsl: '', port: '', defaultUrl: 'my-default-url.unraid.net' },
		// @ts-expect-error Field doesn't exist
		'idontexist');
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"FQDN URL Resolver: Could not resolve any URL for field: \\"idontexist\\""');
});

test('integration test, loading nginx ini and generating all URLs', async () => {
	await store.dispatch(loadStateFiles());

	const urls = getServerIps();
	expect(urls.urls).toMatchInlineSnapshot(`
		[
		  {
		    "ipv4": "https://Tower.local:4443",
		    "ipv6": "https://Tower.local:4443",
		    "name": "Default",
		    "type": "DEFAULT",
		  },
		  {
		    "ipv4": "https://192.168.1.150:4443/",
		    "name": "LAN IPv4",
		    "type": "LAN",
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
		    "ipv4": "https://85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net:4443/",
		    "name": "WAN FQDN",
		    "type": "WAN",
		  },
		]
	`);
	expect(urls.errors).toMatchInlineSnapshot(`
		[
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "lanIp6"],
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "lanFqdn6"],
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "wanFqdn6"],
		]
	`);
});
