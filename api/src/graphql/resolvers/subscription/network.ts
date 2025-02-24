import type { AccessUrlInput } from '@app/graphql/generated/client/graphql.js';
import type { RootState } from '@app/store/index.js';
import { logger } from '@app/core/log.js';
import { type Nginx } from '@app/core/types/states/nginx.js';
import { type AccessUrl } from '@app/graphql/generated/api/types.js';
import { URL_TYPE } from '@app/graphql/generated/client/graphql.js';
import { AccessUrlInputSchema } from '@app/graphql/generated/client/validators.js';
import { store } from '@app/store/index.js';

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

export const getUrlForField = ({
    url,
    port,
    portSsl,
}: UrlForFieldInputInsecure | UrlForFieldInputSecure) => {
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

export type NginxUrlFields = Extract<
    keyof Nginx,
    'lanIp' | 'lanIp6' | 'lanName' | 'lanMdns' | 'lanFqdn' | 'wanFqdn' | 'wanFqdn6'
>;

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
            return getUrlForField({
                url: nginx[field],
                portSsl: nginx.httpsPort,
            });
        }

        if (!nginx.sslEnabled) {
            // Use SSL = no
            return getUrlForField({ url: nginx[field], port: nginx.httpPort });
        }

        if (nginx.sslMode === 'yes') {
            return getUrlForField({
                url: nginx[field],
                portSsl: nginx.httpsPort,
            });
        }

        if (nginx.sslMode === 'auto') {
            throw new Error(`Cannot get IP Based URL for field: "${field}" SSL mode auto`);
        }
    }

    throw new Error(
        `IP URL Resolver: Could not resolve any access URL for field: "${field}", is FQDN?: ${fieldIsFqdn(
            field
        )}`
    );
};

const getUrlTypeFromFqdn = (fqdnType: string): URL_TYPE => {
    switch (fqdnType) {
        case 'LAN':
            return URL_TYPE.LAN;
        case 'WAN':
            return URL_TYPE.WAN;
        case 'WG':
            return URL_TYPE.WIREGUARD;
        default:
            // HACK: This should be added as a new type (e.g. OTHER or CUSTOM)
            return URL_TYPE.WIREGUARD;
    }
};

export const getServerIps = (
    state: RootState = store.getState()
): { urls: AccessUrl[]; errors: Error[] } => {
    const { nginx } = state.emhttp;
    const {
        remote: { wanport },
    } = state.config;
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

    // Now Process the FQDN Urls
    nginx.fqdnUrls.forEach((fqdnUrl) => {
        try {
            const urlType = getUrlTypeFromFqdn(fqdnUrl.interface);
            const fqdnUrlToUse = getUrlForField({
                url: fqdnUrl.fqdn,
                portSsl: urlType === URL_TYPE.WAN ? Number(wanport) : nginx.httpsPort,
            });

            urls.push({
                name: `FQDN ${fqdnUrl.interface}${fqdnUrl.id !== null ? ` ${fqdnUrl.id}` : ''}`,
                type: getUrlTypeFromFqdn(fqdnUrl.interface),
                ipv4: fqdnUrlToUse,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                errors.push(error);
            } else {
                logger.warn('Uncaught error in network resolver', error);
            }
        }
    });

    const safeUrls = urls
        .map((url) => AccessUrlInputSchema().safeParse(url))
        .reduce<AccessUrlInput[]>((acc, curr) => {
            if (curr.success) {
                acc.push(curr.data);
            } else {
                errors.push(curr.error);
            }
            return acc;
        }, []);

    return { urls: safeUrls, errors };
};
