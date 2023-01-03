import { expect, test } from 'vitest';
import { type Nginx } from '../../../../core/types/states/nginx';
import { getUrlForServer, getPortAndDefaultUrl, getServerIps } from '@app/graphql/resolvers/subscription/network';
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
	const result = getUrlForServer({ nginx: { lanIp: '192.168.1.1', sslEnabled: false } as const as Nginx,
		ports:
		{
			port: ':123', portSsl: ':445', defaultUrl: 'hi',
		},
		field: 'lanIp',
		isFqdn: false },
	);
	expect(result).toMatchInlineSnapshot('"http://192.168.1.1:123/"');
});

test('getIpBasedUrlForServer - field exists, ssl yes', () => {
	const result = getUrlForServer({ nginx:
		{ lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes' } as const as Nginx,
	ports: {
		port: ':123', portSsl: ':445', defaultUrl: 'hi',
	},
	field: 'lanIp', isFqdn: false });
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1:445/"');
});

test('getIpBasedUrlForServer - field exists, ssl yes, port empty', () => {
	const result = getUrlForServer(
		{ nginx: { lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes' } as const as Nginx,
			ports: {
				port: '', portSsl: '', defaultUrl: 'hi',
			},
			field: 'lanIp', isFqdn: false });
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1/"');
});

test('getIpBasedUrlForServer - field exists, ssl auto', () => {
	const getResult = async () => getUrlForServer({ nginx:
		{ lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'auto' } as const as Nginx,
	ports: {
		port: ':123', portSsl: ':445', defaultUrl: 'hi',
	},
	field: 'lanIp', isFqdn: false });
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"Cannot get IP Based URL for field: \\"lanIp\\" SSL mode auto"');
});

test('getIpBasedUrlForServer - field does not exist, ssl disabled', () => {
	const getResult = async () => getUrlForServer(
		{
			nginx: { lanIp: '192.168.1.1', sslEnabled: false, sslMode: 'no' } as const as Nginx,
			ports: {
				port: ':123', portSsl: ':445', defaultUrl: 'hi',
			},
			// @ts-expect-error Field doesn't exist
			field: 'idontexist', isFqdn: false });
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"IP URL Resolver: Could not resolve any access URL for field: \\"idontexist\\", is FQDN?: false"');
});

test('getFqdnBasedUrlForServer - field exists, port non-empty', () => {
	const result = getUrlForServer({
		nginx: { lanFqdn: 'my-fqdn.unraid.net' } as const as Nginx,
		ports: { portSsl: ':445', port: '', defaultUrl: 'my-default-url.unraid.net' },
		field: 'lanFqdn',
		isFqdn: true });
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net:445/"');
});

test('getFqdnBasedUrlForServer - field exists, port empty', () => {
	const result = getUrlForServer({ nginx: { lanFqdn: 'my-fqdn.unraid.net' } as const as Nginx,
		ports: { portSsl: '', port: '', defaultUrl: 'my-default-url.unraid.net' },
		field: 'lanFqdn',
		isFqdn: true,
	});
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net/"');
});

test('getIpBasedUrlForServer - field does not exist, ssl disabled', () => {
	const getResult = async () => getUrlForServer({ nginx:
		{ lanFqdn: 'my-fqdn.unraid.net' } as const as Nginx,
	ports: { portSsl: '', port: '', defaultUrl: 'my-default-url.unraid.net' },
	// @ts-expect-error Field doesn't exist
	field: 'idontexist', isFqdn: true });
	void expect(getResult).rejects.toThrowErrorMatchingInlineSnapshot('"IP URL Resolver: Could not resolve any access URL for field: \\"idontexist\\", is FQDN?: true"');
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
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "lanIp6", is FQDN?: false],
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "lanFqdn6", is FQDN?: true],
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "wanFqdn6", is FQDN?: true],
		]
	`);
});
