import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigType } from '../model/connect-config.model.js';
import { URL_TYPE } from '@unraid/shared/network.model.js';

/**
 * Represents a Fully Qualified Domain Name (FQDN) entry in the nginx configuration.
 * These entries are used to map domain names to specific network interfaces.
 */
interface FqdnEntry {
    /** The network interface type (e.g., 'LAN', 'WAN', 'WG') */
    interface: string;
    /** Unique identifier for the interface, null if it's the only interface of its type */
    id: number | null;
    /** The fully qualified domain name */
    fqdn: string;
    /** Whether this is an IPv6 FQDN entry */
    isIpv6: boolean;
}

/**
 * Represents the nginx configuration state from the Unraid system.
 * This interface mirrors the structure of the nginx configuration in the Redux store.
 */
interface Nginx {
    certificateName: string;
    certificatePath: string;
    defaultUrl: string;
    httpPort: number;
    httpsPort: number;
    lanIp: string;
    lanIp6: string;
    lanMdns: string;
    lanName: string;
    sslEnabled: boolean;
    sslMode: 'yes' | 'no' | 'auto';
    wanAccessEnabled: boolean;
    wanIp: string;
    fqdnUrls: FqdnEntry[];
}

/**
 * Base interface for URL field input parameters
 */
interface UrlForFieldInput {
    url: string;
    port?: number;
    portSsl?: number;
}

/**
 * Input parameters for secure URL fields (using SSL)
 */
interface UrlForFieldInputSecure extends UrlForFieldInput {
    url: string;
    portSsl: number;
}

/**
 * Input parameters for insecure URL fields (using HTTP)
 */
interface UrlForFieldInputInsecure extends UrlForFieldInput {
    url: string;
    port: number;
}

/**
 * Represents a server access URL with its type and protocol information.
 * This is the main output type of the URL resolver service.
 */
export interface AccessUrl {
    /** The type of access URL (WAN, LAN, etc.) */
    type: URL_TYPE;
    /** Optional display name for the URL */
    name?: string | null;
    /** IPv4 URL if available */
    ipv4?: URL | null;
    /** IPv6 URL if available */
    ipv6?: URL | null;
}

/**
 * Service responsible for resolving server access URLs from the nginx configuration.
 *
 * This service handles the conversion of nginx configuration into accessible URLs
 * for different network interfaces (WAN, LAN, etc.). It supports both IPv4 and IPv6
 * addresses, as well as FQDN entries.
 *
 * Key Features:
 * - Resolves URLs for all network interfaces (WAN, LAN, MDNS)
 * - Handles both HTTP and HTTPS protocols
 * - Supports FQDN entries with interface-specific configurations
 * - Provides error handling and logging for URL resolution failures
 *
 * Edge Cases and Limitations:
 * 1. SSL Mode 'auto': URLs cannot be resolved for fields when SSL mode is set to 'auto'
 * 2. Missing Ports: Both HTTP and HTTPS ports must be configured for proper URL resolution
 * 3. Store Synchronization: Relies on the store being properly synced via StoreSyncService
 * 4. IPv6 Support: While the service handles IPv6 addresses, some features may be limited
 *    depending on the system's IPv6 configuration
 * 5. FQDN Resolution: FQDN entries must have valid interface types (LAN, WAN, WG)
 *
 * @example
 * ```typescript
 * // Get all available server URLs
 * const { urls, errors } = urlResolverService.getServerIps();
 *
 * // Find WAN access URL
 * const wanUrl = urls.find(url => url.type === URL_TYPE.WAN);
 * ```
 */
@Injectable()
export class UrlResolverService {
    private readonly logger = new Logger(UrlResolverService.name);

    constructor(private readonly configService: ConfigService<ConfigType>) {}

    /**
     * Constructs a URL from the given field parameters.
     * Handles both HTTP and HTTPS protocols based on the provided ports.
     *
     * @param params - URL field parameters including the base URL and port information
     * @returns A properly formatted URL object
     * @throws Error if no URL is provided or if port configuration is invalid
     */
    private getUrlForField({
        url,
        port,
        portSsl,
    }: UrlForFieldInputInsecure | UrlForFieldInputSecure): URL {
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
    }

    /**
     * Checks if a field name represents an FQDN entry.
     *
     * @param field - The field name to check
     * @returns true if the field is an FQDN entry
     */
    private fieldIsFqdn(field: string): boolean {
        return field?.toLowerCase().includes('fqdn');
    }

    /**
     * Resolves a URL for a specific nginx field.
     * Handles different SSL modes and protocols.
     *
     * @param nginx - The nginx configuration
     * @param field - The field to resolve the URL for
     * @returns A URL object for the specified field
     * @throws Error if the URL cannot be resolved or if SSL mode is 'auto'
     */
    private getUrlForServer(nginx: Nginx, field: keyof Nginx): URL {
        if (nginx[field]) {
            if (this.fieldIsFqdn(field)) {
                return this.getUrlForField({
                    url: nginx[field] as string,
                    portSsl: nginx.httpsPort,
                });
            }

            if (!nginx.sslEnabled) {
                return this.getUrlForField({ url: nginx[field] as string, port: nginx.httpPort });
            }

            if (nginx.sslMode === 'yes') {
                return this.getUrlForField({
                    url: nginx[field] as string,
                    portSsl: nginx.httpsPort,
                });
            }

            if (nginx.sslMode === 'auto') {
                throw new Error(`Cannot get IP Based URL for field: "${field}" SSL mode auto`);
            }
        }

        throw new Error(
            `IP URL Resolver: Could not resolve any access URL for field: "${field}", is FQDN?: ${this.fieldIsFqdn(
                field
            )}`
        );
    }

    /**
     * Returns the set of local URLs allowed to access the Unraid API
     */
    getAllowedLocalAccessUrls(): string[] {
        const { nginx } = this.configService.getOrThrow('store.emhttp');
        try {
            return [
                this.getUrlForField({ url: 'localhost', port: nginx.httpPort }),
                this.getUrlForField({ url: 'localhost', portSsl: nginx.httpsPort }),
            ].map((url) => url.toString());
        } catch (error: unknown) {
            this.logger.warn('Uncaught error in getLocalAccessUrls: %o', error);
            return [];
        }
    }

    /**
     * Returns the set of server IPs (both IPv4 and IPv6) allowed to access the Unraid API
     */
    getAllowedServerIps(): string[] {
        const { urls } = this.getServerIps();
        return urls.reduce<string[]>((acc, curr) => {
            if ((curr.ipv4 && curr.ipv6) || curr.ipv4) {
                acc.push(curr.ipv4.toString());
            } else if (curr.ipv6) {
                acc.push(curr.ipv6.toString());
            }

            return acc;
        }, []);
    }

    /**
     * Resolves all available server access URLs from the nginx configuration.
     * This is the main method of the service that aggregates all possible access URLs.
     *
     * The method processes:
     * 1. Default URL
     * 2. LAN IPv4 and IPv6 URLs
     * 3. LAN Name and MDNS URLs
     * 4. FQDN URLs for different interfaces
     *
     * @returns Object containing an array of resolved URLs and any errors encountered
     */
    getServerIps(): { urls: AccessUrl[]; errors: Error[] } {
        const store = this.configService.get('store');
        if (!store) {
            return { urls: [], errors: [new Error('Store not loaded')] };
        }

        const { nginx } = store.emhttp;
        const {
            config: {
                remote: { wanport },
            },
        } = store;

        if (!nginx || Object.keys(nginx).length === 0) {
            return { urls: [], errors: [new Error('Nginx Not Loaded')] };
        }

        const errors: Error[] = [];
        const urls: AccessUrl[] = [];

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
                this.logger.warn('Uncaught error in network resolver', error);
            }
        }

        try {
            // Lan IP URL
            const lanIp4Url = this.getUrlForServer(nginx, 'lanIp');
            urls.push({
                name: 'LAN IPv4',
                type: URL_TYPE.LAN,
                ipv4: lanIp4Url,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                errors.push(error);
            } else {
                this.logger.warn('Uncaught error in network resolver', error);
            }
        }

        try {
            // Lan IP6 URL
            const lanIp6Url = this.getUrlForServer(nginx, 'lanIp6');
            urls.push({
                name: 'LAN IPv6',
                type: URL_TYPE.LAN,
                ipv4: lanIp6Url,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                errors.push(error);
            } else {
                this.logger.warn('Uncaught error in network resolver', error);
            }
        }

        try {
            // Lan Name URL
            const lanNameUrl = this.getUrlForServer(nginx, 'lanName');
            urls.push({
                name: 'LAN Name',
                type: URL_TYPE.MDNS,
                ipv4: lanNameUrl,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                errors.push(error);
            } else {
                this.logger.warn('Uncaught error in network resolver', error);
            }
        }

        try {
            // Lan MDNS URL
            const lanMdnsUrl = this.getUrlForServer(nginx, 'lanMdns');
            urls.push({
                name: 'LAN MDNS',
                type: URL_TYPE.MDNS,
                ipv4: lanMdnsUrl,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                errors.push(error);
            } else {
                this.logger.warn('Uncaught error in network resolver', error);
            }
        }

        // Now Process the FQDN Urls
        nginx.fqdnUrls.forEach((fqdnUrl: FqdnEntry) => {
            try {
                const urlType = this.getUrlTypeFromFqdn(fqdnUrl.interface);
                const fqdnUrlToUse = this.getUrlForField({
                    url: fqdnUrl.fqdn,
                    portSsl: urlType === URL_TYPE.WAN ? Number(wanport) : nginx.httpsPort,
                });

                urls.push({
                    name: `FQDN ${fqdnUrl.interface}${fqdnUrl.id !== null ? ` ${fqdnUrl.id}` : ''}`,
                    type: this.getUrlTypeFromFqdn(fqdnUrl.interface),
                    ipv4: fqdnUrlToUse,
                });
            } catch (error: unknown) {
                if (error instanceof Error) {
                    errors.push(error);
                } else {
                    this.logger.warn('Uncaught error in network resolver', error);
                }
            }
        });

        return { urls, errors };
    }

    /**
     * Maps FQDN interface types to URL types.
     *
     * @param fqdnType - The FQDN interface type
     * @returns The corresponding URL_TYPE
     */
    private getUrlTypeFromFqdn(fqdnType: string): URL_TYPE {
        switch (fqdnType) {
            case 'LAN':
                return URL_TYPE.LAN;
            case 'WAN':
                return URL_TYPE.WAN;
            case 'WG':
                return URL_TYPE.WIREGUARD;
            default:
                return URL_TYPE.WIREGUARD;
        }
    }

    getRemoteAccessUrl(): AccessUrl | null {
        const { urls } = this.getServerIps();
        return urls.find((url) => url.type === URL_TYPE.WAN) ?? null;
    }
}
