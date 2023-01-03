import { GraphQLClient } from '@app/mothership/graphql-client';
import { type Nginx } from '@app/core/types/states/nginx';
import { getters, store } from '@app/store';
import { type NetworkInput, URL_TYPE, type AccessUrlInput } from '@app/graphql/generated/client/graphql';
import { dashboardLogger, logger } from '@app/core';
import { isEqual } from 'lodash';
import { SEND_NETWORK_MUTATION } from '@app/graphql/mothership/mutations';
import { saveNetworkPacket } from '@app/store/modules/dashboard';
import { ApolloError } from '@apollo/client';

export interface PortAndDefaultUrl {
	port: string;
	portSsl: string;
	defaultUrl: string;
}

export const getPortAndDefaultUrl = (nginx: Nginx): PortAndDefaultUrl => {
	const port = nginx.httpPort === 80 ? '' : `:${nginx.httpPort}`;
	const portSsl = nginx.httpsPort === 443 ? '' : `:${nginx.httpsPort}`;
	const defaultUrl = nginx.defaultUrl ?? '';
	return { port, portSsl, defaultUrl };
};

const fieldIsFqdn = (field: keyof Nginx) => field.toLowerCase().includes('fqdn');
/**
 *
 * @param nginx Nginx Config File
 * @param ports Ports discovered using getPortAndDefaultUrl
 * @param field The field to build the URL from
 * @returns a URL, created from the combination of inputs
 * @throws Error when the URL cannot be created or the URL is invalid
 */
export const getUrlForServer = ({ nginx, ports, field }: { nginx: Nginx; ports: PortAndDefaultUrl; field: keyof Nginx }): URL => {
	if (nginx[field]) {
		if (fieldIsFqdn(field)) {
			return new URL(`https://${nginx[field]}${ports.portSsl}`);
		}

		if (!nginx.sslEnabled) {// Use SSL = no
			return new URL(`http://${nginx[field]}${ports.port}`);
		}

		if (nginx.sslMode === 'yes') {
			return new URL(`https://${nginx[field]}${ports.portSsl}`);
		}

		if (nginx.sslMode === 'auto') {
			throw new Error(`Cannot get IP Based URL for field: "${field}" SSL mode auto`);
		}
	}

	throw new Error(`IP URL Resolver: Could not resolve any access URL for field: "${field}", is FQDN?: ${fieldIsFqdn(field)}`);
};

export const getServerIps = (): { urls: AccessUrlInput[]; errors: Error[] } => {
	const { nginx } = getters.emhttp();
	if (!nginx) {
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
		// Lan MDNS URL
		const lanIp6Url = getUrlForServer({ nginx, ports, field: 'lanMdns' });
		urls.push({
			name: 'LAN MDNS',
			type: URL_TYPE.MDNS,
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
		// Lan FQDN URL
		const lanFqdn = getUrlForServer({ nginx, ports, field: 'lanFqdn' });
		urls.push({
			name: 'LAN FQDN',
			type: URL_TYPE.LAN,
			ipv4: lanFqdn,
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
		const lanFqdn6 = getUrlForServer({ nginx, ports, field: 'lanFqdn6' });
		urls.push({
			name: 'LAN FQDNv6',
			type: URL_TYPE.LAN,
			ipv6: lanFqdn6,
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
		const wanFqdn = getUrlForServer({ nginx, ports, field: 'wanFqdn' });
		urls.push({
			name: 'WAN FQDN',
			type: URL_TYPE.WAN,
			ipv4: wanFqdn,
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
		const wanFqdn6 = getUrlForServer({ nginx, ports, field: 'wanFqdn6' });
		urls.push({
			name: 'WAN FQDNv6',
			type: URL_TYPE.WAN,
			ipv6: wanFqdn6,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	return { urls, errors };
};

export const publishNetwork = async () => {
	try {
		const client = GraphQLClient.getInstance();
		const datapacket = getServerIps();

		const { lastNetworkPacket } = getters.dashboard();
		const { apikey: apiKey } = getters.config().remote;
		if (!isEqual(datapacket, lastNetworkPacket)) {
			const input: NetworkInput = { accessUrls: datapacket.urls };

			dashboardLogger.addContext('data', datapacket);
			dashboardLogger.info('Sending data packet for network');
			dashboardLogger.removeContext('data');
			const result = await client.mutate({
				mutation: SEND_NETWORK_MUTATION,
				variables: {
					apiKey,
					data: input,
				},
			});
			dashboardLogger.debug('Result of send network mutation:\n%o', result);

			store.dispatch(saveNetworkPacket({ lastNetworkPacket: input }));
		}
	} catch (error: unknown) {
		if (error instanceof ApolloError) {
			dashboardLogger.error('Failed publishing with GQL Errors: %s, \nClient Errors: %s', error.graphQLErrors.map(error => error.message).join(','), error.clientErrors.join(', '));
		} else {
			dashboardLogger.error(error);
		}
	}
};
