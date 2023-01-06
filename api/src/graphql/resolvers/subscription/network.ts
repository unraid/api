import { GraphQLClient } from '@app/mothership/graphql-client';
import { type WireguardFqdn, type Nginx } from '@app/core/types/states/nginx';
import { type RootState, store, getters } from '@app/store';
import { type NetworkInput, URL_TYPE, type AccessUrlInput } from '@app/graphql/generated/client/graphql';
import { dashboardLogger, logger } from '@app/core';
import { isEqual } from 'lodash';
import { SEND_NETWORK_MUTATION } from '@app/graphql/mothership/mutations';
import { saveNetworkPacket } from '@app/store/modules/dashboard';
import { ApolloError } from '@apollo/client';

export interface PortAndDefaultUrl {
	port: string;
	portSsl: string;
	defaultUrl: URL | null;
}

const getUrlForField = ({ secure, url, port }: { secure: boolean; url: string; port: string }) => {
	const urlString = `${secure ? 'https://' : 'http://'}${url}${port}`;
	try {
		return new URL(urlString);
	} catch (error: unknown) {
		throw new Error(`Failed to parse URL: ${urlString}`);
	}
};

export const getPortAndDefaultUrl = (nginx: Nginx): PortAndDefaultUrl => {
	const port = nginx.httpPort === 80 ? '' : `:${nginx.httpPort}`;
	const portSsl = nginx.httpsPort === 443 ? '' : `:${nginx.httpsPort}`;
	let defaultUrl: URL | null = null;
	try {
		defaultUrl = new URL(nginx.defaultUrl);
	} catch (error: unknown) {
		dashboardLogger.warn('Could not parse NGINX_DEFAULTURL to a valid URL, your nginx.ini file may have a problem');
	}

	return { port, portSsl, defaultUrl };
};

const fieldIsFqdn = (field: keyof Nginx) => field.toLowerCase().includes('fqdn');

type NginxUrlFields = Extract<keyof Nginx, 'lanIp' | 'lanIp6' | 'lanName' | 'lanMdns' | 'lanFqdn' | 'lanFqdn6' | 'wanFqdn' | 'wanFqdn6'>;

/**
 *
 * @param nginx Nginx Config File
 * @param ports Ports discovered using getPortAndDefaultUrl
 * @param field The field to build the URL from
 * @returns a URL, created from the combination of inputs
 * @throws Error when the URL cannot be created or the URL is invalid
 */
export const getUrlForServer = ({ nginx, ports, field }: { nginx: Nginx; ports: PortAndDefaultUrl; field: NginxUrlFields }): URL => {
	if (nginx[field]) {
		if (fieldIsFqdn(field)) {
			return getUrlForField({ secure: true, url: nginx[field], port: ports.portSsl });
		}

		if (!nginx.sslEnabled) {// Use SSL = no
			return getUrlForField({ secure: false, url: nginx[field], port: ports.port });
		}

		if (nginx.sslMode === 'yes') {
			return getUrlForField({ secure: true, url: nginx[field], port: ports.portSsl });
		}

		if (nginx.sslMode === 'auto') {
			throw new Error(`Cannot get IP Based URL for field: "${field}" SSL mode auto`);
		}
	}

	throw new Error(`IP URL Resolver: Could not resolve any access URL for field: "${field}", is FQDN?: ${fieldIsFqdn(field)}`);
};

// eslint-disable-next-line complexity
export const getServerIps = (state: RootState = store.getState()): { urls: AccessUrlInput[]; errors: Error[] } => {
	const { nginx } = state.emhttp;
	const { remote: { wanport } } = state.config;
	if (!nginx || Object.keys(nginx).length === 0) {
		return { urls: [], errors: [new Error('Nginx Not Loaded')] };
	}

	const ports = getPortAndDefaultUrl(nginx);

	const errors: Error[] = [];
	const urls: AccessUrlInput[] = [];

	if (ports.defaultUrl) {
		const defaultUrlInput: AccessUrlInput = {
			name: 'Default',
			type: URL_TYPE.DEFAULT,
			ipv4: ports.defaultUrl,
			ipv6: ports.defaultUrl,
		};
		urls.push(defaultUrlInput);
	}

	try {
		// Lan IP URL
		const lanIp4Url = getUrlForServer({ nginx, ports, field: 'lanIp' });
		urls.push({
			name: 'LAN IPv4',
			type: URL_TYPE.LAN,
			ipv4: lanIp4Url,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// Lan IP6 URL
		const lanIp6Url = getUrlForServer({ nginx, ports, field: 'lanIp6' });
		urls.push({
			name: 'LAN IPv6',
			type: URL_TYPE.LAN,
			ipv4: lanIp6Url,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// Lan Name URL
		const lanNameUrl = getUrlForServer({ nginx, ports, field: 'lanName' });
		urls.push({
			name: 'LAN Name',
			type: URL_TYPE.MDNS,
			ipv4: lanNameUrl,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// Lan MDNS URL
		const lanMdnsUrl = getUrlForServer({ nginx, ports, field: 'lanMdns' });
		urls.push({
			name: 'LAN MDNS',
			type: URL_TYPE.MDNS,
			ipv4: lanMdnsUrl,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// Lan FQDN URL
		const lanFqdnUrl = getUrlForServer({ nginx, ports, field: 'lanFqdn' });
		urls.push({
			name: 'LAN FQDN',
			type: URL_TYPE.LAN,
			ipv4: lanFqdnUrl,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// Lan FQDN6 URL
		const lanFqdn6Url = getUrlForServer({ nginx, ports, field: 'lanFqdn6' });
		urls.push({
			name: 'LAN FQDNv6',
			type: URL_TYPE.LAN,
			ipv6: lanFqdn6Url,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// WAN FQDN URL
		const wanFqdnUrl = getUrlForField({ secure: true, url: nginx.wanFqdn, port: `:${wanport}` });
		urls.push({
			name: 'WAN FQDN',
			type: URL_TYPE.WAN,
			ipv4: wanFqdnUrl,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// WAN FQDN6 URL
		const wanFqdn6Url = getUrlForField({ secure: true, url: nginx.wanFqdn6, port: `:${wanport}` });
		urls.push({
			name: 'WAN FQDNv6',
			type: URL_TYPE.WAN,
			ipv6: wanFqdn6Url,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	for (const wgFqdn of nginx.wgFqdns) {
		try {
			// WG FQDN URL
			const wgFqdnUrl = getUrlForField({ secure: true, url: wgFqdn.fqdn, port: ports.portSsl });
			urls.push({
				name: `WG FQDN ${wgFqdn.id}`,
				type: URL_TYPE.WIREGUARD,
				ipv4: wgFqdnUrl,
			});
		} catch (error: unknown) {
			if (error instanceof Error) {
				errors.push(error);
			} else {
				logger.warn('Uncaught error in network resolver', error);
			}
		}
	}

	return { urls, errors };
};

export const publishNetwork = async () => {
	dashboardLogger.trace('Got here');
	try {
		const client = GraphQLClient.getInstance();

		const datapacket = getServerIps();
		const newNetworkPacket: NetworkInput = { accessUrls: datapacket.urls };

		const { lastNetworkPacket } = getters.dashboard();
		const { apikey: apiKey } = getters.config().remote;
		if (isEqual(JSON.stringify(lastNetworkPacket), JSON.stringify(newNetworkPacket))) {
			dashboardLogger.trace('Skipping sending network update as it is the same as the last one');
		} else {
			dashboardLogger.addContext('data', datapacket);
			dashboardLogger.info('Sending data packet for network');
			dashboardLogger.removeContext('data');
			const result = await client.mutate({
				mutation: SEND_NETWORK_MUTATION,
				variables: {
					apiKey,
					data: newNetworkPacket,
				},
			});
			dashboardLogger.debug('Result of send network mutation:\n%o', result);
			store.dispatch(saveNetworkPacket({ lastNetworkPacket: newNetworkPacket }));
		}
	} catch (error: unknown) {
		dashboardLogger.trace('ERROR', error);
		if (error instanceof ApolloError) {
			dashboardLogger.error('Failed publishing with GQL Errors: %s, \nClient Errors: %s', error.graphQLErrors.map(error => error.message).join(','), error.clientErrors.join(', '));
		} else {
			dashboardLogger.error(error);
		}
	}
};
