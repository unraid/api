import { GraphQLClient } from '@app/mothership/graphql-client';
import { type Nginx } from '@app/core/types/states/nginx';
import { getters } from '@app/store';
import { URL_TYPE, type AccessUrlInput } from '@app/graphql/generated/client/graphql';
import { logger } from '@app/core';

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

/**
 *
 * @param nginx Nginx Config File
 * @param ports Ports discovered using getPortAndDefaultUrl
 * @param field The field to build the URL from
 * @returns a URL, created from the combination of inputs
 * @throws Error when the URL cannot be created or the URL is invalid
 */
export const getIpBasedUrlForServer = (nginx: Nginx, ports: PortAndDefaultUrl, field: keyof Nginx): URL => {
	if (nginx[field]) {
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

	throw new Error(`IP URL Resolver: Could not resolve any access URL for field: "${field}"`);
};

export const getFQDNBasedUrlForServer = (nginx: Nginx, ports: PortAndDefaultUrl, field: keyof Nginx): URL => {
	if (nginx[field]) {
		return new URL(`https://${nginx[field]}${ports.portSsl}`);
	}

	throw new Error(`FQDN URL Resolver: Could not resolve any URL for field: "${field}"`);
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
		const lanIp4Url = getIpBasedUrlForServer(nginx, ports, 'lanIp');
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
		const lanIp6Url = getIpBasedUrlForServer(nginx, ports, 'lanIp6');
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
		const lanIp6Url = getIpBasedUrlForServer(nginx, ports, 'lanMdns');
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
		const lanFqdn = getIpBasedUrlForServer(nginx, ports, 'lanFqdn');
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
		const lanFqdn6 = getIpBasedUrlForServer(nginx, ports, 'lanFqdn6');
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
		const wanFqdn = getIpBasedUrlForServer(nginx, ports, 'wanFqdn');
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
		const wanFqdn6 = getIpBasedUrlForServer(nginx, ports, 'wanFqdn6');
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

const publishNetwork = () => {
	const client = GraphQLClient.getInstance();
};
