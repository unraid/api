import { GraphQLClient } from '@app/mothership/graphql-client';
import { type Nginx } from '@app/core/types/states/nginx';
import { type RootState, store, getters } from '@app/store';
import { type NetworkInput, URL_TYPE, type AccessUrlInput } from '@app/graphql/generated/client/graphql';
import { dashboardLogger, logger } from '@app/core';
import { isEqual } from 'lodash';
import { SEND_NETWORK_MUTATION } from '@app/graphql/mothership/mutations';
import { saveNetworkPacket } from '@app/store/modules/dashboard';
import { ApolloError } from '@apollo/client/core/core.cjs';
import { AccessUrlInputSchema, NetworkInputSchema } from '@app/graphql/generated/client/validators';
import { ZodError } from 'zod';

interface UrlForFieldInput {
	url: string;
	port?: number;
	portSsl?: number;
}

interface UrlForFieldInputSecure extends UrlForFieldInput {
	url: string;
	portSsl: number;
}
interface UrlForFieldInputInsecure extends UrlForFieldInput {
	url: string;
	port: number;
}

export const getUrlForField = ({ url, port, portSsl }: UrlForFieldInputInsecure | UrlForFieldInputSecure) => {
	let portToUse = '';
	let httpMode = 'https://';

	if (!url || url === '') {
		throw new Error('No URL Provided');
	}

	if (port) {
		portToUse = port === 80 ? '' : `:${port}`;
		httpMode = 'http://';
	} else if (portSsl) {
		portToUse = portSsl === 443 ? '' : `:${portSsl}`;
		httpMode = 'https://';
	} else {
		throw new Error(`No ports specified for URL: ${url}`);
	}

	const urlString = `${httpMode}${url}${portToUse}`;

	try {
		return new URL(urlString);
	} catch (error: unknown) {
		throw new Error(`Failed to parse URL: ${urlString}`);
	}
};

const fieldIsFqdn = (field: keyof Nginx) => field?.toLowerCase().includes('fqdn');

export type NginxUrlFields = Extract<keyof Nginx, 'lanIp' | 'lanIp6' | 'lanName' | 'lanMdns' | 'lanFqdn' | 'lanFqdn6' | 'wanFqdn' | 'wanFqdn6'>;

/**
 *
 * @param nginx Nginx Config File
 * @param field The field to build the URL from
 * @returns a URL, created from the combination of inputs
 * @throws Error when the URL cannot be created or the URL is invalid
 */
export const getUrlForServer = ({ nginx, field }: { nginx: Nginx; field: NginxUrlFields }): URL => {
	if (nginx[field]) {
		if (fieldIsFqdn(field)) {
			return getUrlForField({ url: nginx[field], portSsl: nginx.httpsPort });
		}

		if (!nginx.sslEnabled) {// Use SSL = no
			return getUrlForField({ url: nginx[field], port: nginx.httpPort });
		}

		if (nginx.sslMode === 'yes') {
			return getUrlForField({ url: nginx[field], portSsl: nginx.httpsPort });
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

	const errors: Error[] = [];
	const urls: AccessUrlInput[] = [];

	try {
		// Default URL
		const defaultUrl = new URL(nginx.defaultUrl);
		urls.push({
			name: 'Default',
			type: URL_TYPE.DEFAULT,
			ipv4: defaultUrl,
			ipv6: defaultUrl,
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			errors.push(error);
		} else {
			logger.warn('Uncaught error in network resolver', error);
		}
	}

	try {
		// Lan IP URL
		const lanIp4Url = getUrlForServer({ nginx, field: 'lanIp' });
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
		const lanIp6Url = getUrlForServer({ nginx, field: 'lanIp6' });
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
		const lanNameUrl = getUrlForServer({ nginx, field: 'lanName' });
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
		const lanMdnsUrl = getUrlForServer({ nginx, field: 'lanMdns' });
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
		const lanFqdnUrl = getUrlForServer({ nginx, field: 'lanFqdn' });
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
		const lanFqdn6Url = getUrlForServer({ nginx, field: 'lanFqdn6' });
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
		const wanFqdnUrl = getUrlForField({ url: nginx.wanFqdn, portSsl: Number(wanport || 443) });
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
		const wanFqdn6Url = getUrlForField({ url: nginx.wanFqdn6, portSsl: Number(wanport) });
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
			const wgFqdnUrl = getUrlForField({ url: wgFqdn.fqdn, portSsl: nginx.httpsPort });
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

	const safeUrls = urls.map((url) => AccessUrlInputSchema().safeParse(url)).reduce<AccessUrlInput[]>((acc, curr) => {
		if (curr.success) {
			acc.push(curr.data)
		} else {
			errors.push(curr.error)
		}
		return acc;
	}, []);

	return { urls: safeUrls, errors };
};

export const publishNetwork = async () => {
	try {
		const client = GraphQLClient.getInstance();

		const datapacket = getServerIps();
		if (datapacket.errors ) {
			const zodErrors = datapacket.errors.filter(error => error instanceof ZodError)
			if (zodErrors.length) {
				dashboardLogger.warn('Validation Errors Encountered with Network Payload: %s', zodErrors.map(error => error.message).join(','))
			}
		}
		const networkPacket: NetworkInput = { accessUrls: datapacket.urls }
		const validatedNetwork = NetworkInputSchema().parse(networkPacket);
		
		const { lastNetworkPacket } = getters.dashboard();
		const { apikey: apiKey } = getters.config().remote;
		if (isEqual(JSON.stringify(lastNetworkPacket), JSON.stringify(validatedNetwork))) {
			dashboardLogger.trace('[DASHBOARD] Skipping Update');
		} else if (client) {
			dashboardLogger.addContext('data', validatedNetwork);
			dashboardLogger.info('Sending data packet for network');
			dashboardLogger.removeContext('data');
			const result = await client.mutate({
				mutation: SEND_NETWORK_MUTATION,
				variables: {
					apiKey,
					data: validatedNetwork,
				},
			});
			dashboardLogger.addContext('sendNetworkResult', result);
			dashboardLogger.debug('Sent network mutation with %s urls', datapacket.urls.length);
			dashboardLogger.removeContext('sendNetworkResult');
			store.dispatch(saveNetworkPacket({ lastNetworkPacket: validatedNetwork }));
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
