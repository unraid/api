import { expect, test } from 'vitest';
import { type Nginx } from '../../../../core/types/states/nginx';
import { getUrlForServer, getPortAndDefaultUrl, getServerIps, type PortAndDefaultUrl } from '@app/graphql/resolvers/subscription/network';
import { store } from '@app/store';
import { loadStateFiles } from '@app/store/modules/emhttp';

test.each([
	[{ httpPort: 80, httpsPort: 443, defaultUrl: new URL('https://my-default-url.com') }],
	[{ httpPort: 123, httpsPort: 443, defaultUrl: 'https://my-default-url.com' }],
	[{ httpPort: 80, httpsPort: 12_345, defaultUrl: 'https://my-default-url.com' }],
	[{ httpPort: 212, httpsPort: 3_233, defaultUrl: 'https://my-default-url.com' }],
	[{ httpPort: 80, httpsPort: 443, defaultUrl: 'BROKEN_URL' }],

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

	let parsedUrl: URL | null = null;
	try {
		parsedUrl = new URL(defaultUrl);
	} catch (err: unknown) {
		// No catch block, catches broken url issue
	}

	expect(response.defaultUrl?.toString()).toBe(parsedUrl?.toString());
});

test('getUrlForServer - field exists, ssl disabled', () => {
	const result = getUrlForServer({ nginx: { lanIp: '192.168.1.1', sslEnabled: false } as const as Nginx,
		ports:
		{
			port: ':123', portSsl: ':445', defaultUrl: new URL('https://my-default-url.unraid.net'),
		},
		field: 'lanIp',
	});
	expect(result).toMatchInlineSnapshot('"http://192.168.1.1:123/"');
});

test('getUrlForServer - field exists, ssl yes', () => {
	const result = getUrlForServer({ nginx:
		{ lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes' } as const as Nginx,
	ports: {
		port: ':123', portSsl: ':445', defaultUrl: new URL('https://my-default-url.unraid.net'),
	},
	field: 'lanIp',
	});
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1:445/"');
});

test('getUrlForServer - field exists, ssl yes, port empty', () => {
	const result = getUrlForServer(
		{ nginx: { lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'yes' } as const as Nginx,
			ports: {
				port: '', portSsl: '', defaultUrl: new URL('https://my-default-url.unraid.net'),
			},
			field: 'lanIp',
		});
	expect(result).toMatchInlineSnapshot('"https://192.168.1.1/"');
});

test('getUrlForServer - field exists, ssl auto', () => {
	const getResult = async () => getUrlForServer({ nginx:
		{ lanIp: '192.168.1.1', sslEnabled: true, sslMode: 'auto' } as const as Nginx,
	ports: {
		port: ':123', portSsl: ':445', defaultUrl: new URL('https://my-default-url.unraid.net'),
	},
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
		nginx: { lanFqdn: 'my-fqdn.unraid.net' } as const as Nginx,
		ports: { portSsl: ':445', port: '', defaultUrl: new URL('https://my-default-url.unraid.net') },
		field: 'lanFqdn',
	});
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net:445/"');
});

test('getUrlForServer - FQDN - field exists, port empty', () => {
	const result = getUrlForServer({ nginx: { lanFqdn: 'my-fqdn.unraid.net' } as const as Nginx,
		ports: { portSsl: '', port: '', defaultUrl: new URL('https://my-default-url.unraid.net') },
		field: 'lanFqdn',
	});
	expect(result).toMatchInlineSnapshot('"https://my-fqdn.unraid.net/"');
});

test.each([
	[{ nginx: { lanFqdn: 'my-fqdn.unraid.net', sslEnabled: false, sslMode: 'no' } as const as Nginx, ports: { port: '', portSsl: '', defaultUrl: new URL('https://my-default-url.com') } as const as PortAndDefaultUrl, field: 'lanFqdn' as keyof Nginx }],
	[{ nginx: { wanFqdn: 'my-fqdn.unraid.net', sslEnabled: true, sslMode: 'yes' } as const as Nginx, ports: { port: '', portSsl: '', defaultUrl: new URL('https://my-default-url.com') } as const as PortAndDefaultUrl, field: 'wanFqdn' as keyof Nginx }],
	[{ nginx: { wanFqdn6: 'my-fqdn.unraid.net', sslEnabled: true, sslMode: 'auto' } as const as Nginx, ports: { port: '', portSsl: '', defaultUrl: new URL('https://my-default-url.com') } as const as PortAndDefaultUrl, field: 'wanFqdn6' as keyof Nginx }],

])('getUrlForServer - FQDN', ({ nginx, ports, field }) => {
	const result = getUrlForServer({ nginx, ports, field });
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
		    "ipv4": "https://85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net:4443/",
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
		  [Error: IP URL Resolver: Could not resolve any access URL for field: "wanFqdn6", is FQDN?: true],
		]
	`);
});
