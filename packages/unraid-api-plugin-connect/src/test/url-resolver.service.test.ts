import { ConfigService } from '@nestjs/config';

import type { Mock } from 'vitest';
import { URL_TYPE } from '@unraid/shared/network.model.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigType } from '../model/connect-config.model.js';
import { UrlResolverService } from '../service/url-resolver.service.js';

interface PortTestParams {
    httpPort: number;
    httpsPort: number;
}

describe('UrlResolverService', () => {
    let service: UrlResolverService;
    let mockConfigService: ConfigService<ConfigType, true>;

    beforeEach(() => {
        mockConfigService = {
            get: vi.fn(),
            getOrThrow: vi.fn(),
        } as unknown as ConfigService<ConfigType, true>;

        service = new UrlResolverService(mockConfigService);
    });

    describe('getServerIps', () => {
        it('should return empty arrays when store is not loaded', () => {
            (mockConfigService.get as Mock).mockReturnValue(null);
            (mockConfigService.getOrThrow as Mock).mockReturnValue(null);

            const result = service.getServerIps();

            expect(result).toEqual({
                urls: [],
                errors: [new Error('Store not loaded')],
            });
        });

        it('should return empty arrays when nginx is not loaded', () => {
            (mockConfigService.get as Mock).mockReturnValue({
                emhttp: {},
            });

            const result = service.getServerIps();

            expect(result).toEqual({
                urls: [],
                errors: [new Error('Nginx Not Loaded')],
            });
        });

        it.each<PortTestParams>([
            { httpPort: 80, httpsPort: 443 },
            { httpPort: 123, httpsPort: 443 },
            { httpPort: 80, httpsPort: 12_345 },
            { httpPort: 212, httpsPort: 3_233 },
        ])('should handle different port combinations: %j', (params: PortTestParams) => {
            const { httpPort, httpsPort } = params;
            const mockStore = {
                emhttp: {
                    nginx: {
                        defaultUrl: 'https://default.unraid.net',
                        lanIp: '192.168.1.1',
                        lanIp6: '2001:db8::1',
                        lanName: 'unraid.local',
                        lanMdns: 'unraid.local',
                        sslEnabled: true,
                        sslMode: 'yes',
                        httpPort,
                        httpsPort,
                        fqdnUrls: [],
                    },
                },
            };

            (mockConfigService.get as Mock).mockReturnValue(mockStore);

            const result = service.getServerIps();
            const lanUrl = result.urls.find(
                (url) => url.type === URL_TYPE.LAN && url.name === 'LAN IPv4'
            );

            expect(lanUrl).toBeDefined();
            if (httpsPort === 443) {
                expect(lanUrl?.ipv4?.toString()).toBe('https://192.168.1.1/');
            } else {
                expect(lanUrl?.ipv4?.toString()).toBe(`https://192.168.1.1:${httpsPort}/`);
            }
        });

        it('should handle broken URLs gracefully', () => {
            const mockStore = {
                emhttp: {
                    nginx: {
                        defaultUrl: 'https://BROKEN_URL',
                        lanIp: '192.168.1.1',
                        lanIp6: '2001:db8::1',
                        lanName: 'unraid.local',
                        lanMdns: 'unraid.local',
                        sslEnabled: true,
                        sslMode: 'yes',
                        httpPort: 80,
                        httpsPort: 443,
                        fqdnUrls: [],
                    },
                },
            };

            (mockConfigService.get as Mock).mockReturnValue(mockStore);

            const result = service.getServerIps();
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some((error) => error.message.includes('Failed to parse URL'))).toBe(
                true
            );
        });

        it('should handle SSL mode variations', () => {
            const testCases = [
                {
                    sslEnabled: false,
                    sslMode: 'no',
                    expectedProtocol: 'http',
                    expectedPort: 80,
                },
                {
                    sslEnabled: true,
                    sslMode: 'yes',
                    expectedProtocol: 'https',
                    expectedPort: 443,
                },
                {
                    sslEnabled: true,
                    sslMode: 'auto',
                    shouldError: true,
                },
            ];

            testCases.forEach((testCase) => {
                const mockStore = {
                    emhttp: {
                        nginx: {
                            defaultUrl: 'https://default.unraid.net',
                            lanIp: '192.168.1.1',
                            lanIp6: '2001:db8::1',
                            lanName: 'unraid.local',
                            lanMdns: 'unraid.local',
                            sslEnabled: testCase.sslEnabled,
                            sslMode: testCase.sslMode,
                            httpPort: 80,
                            httpsPort: 443,
                            fqdnUrls: [],
                        },
                    },
                };

                (mockConfigService.get as Mock).mockReturnValue(mockStore);

                const result = service.getServerIps();

                if (testCase.shouldError) {
                    expect(result.errors.some((error) => error.message.includes('SSL mode auto'))).toBe(
                        true
                    );
                } else {
                    const lanUrl = result.urls.find(
                        (url) => url.type === URL_TYPE.LAN && url.name === 'LAN IPv4'
                    );
                    expect(lanUrl).toBeDefined();
                    expect(lanUrl?.ipv4?.toString()).toBe(`${testCase.expectedProtocol}://192.168.1.1/`);
                }
            });
        });

        it('should resolve URLs for all network interfaces', () => {
            const mockStore = {
                emhttp: {
                    nginx: {
                        defaultUrl: 'https://default.unraid.net',
                        lanIp: '192.168.1.1',
                        lanIp6: 'ipv6.unraid.local',
                        lanName: 'unraid.local',
                        lanMdns: 'unraid.local',
                        sslEnabled: true,
                        sslMode: 'yes',
                        httpPort: 80,
                        httpsPort: 443,
                        fqdnUrls: [
                            {
                                interface: 'LAN',
                                id: null,
                                fqdn: 'lan.unraid.net',
                                isIpv6: false,
                            },
                            {
                                interface: 'WAN',
                                id: null,
                                fqdn: 'wan.unraid.net',
                                isIpv6: false,
                            },
                        ],
                    },
                },
            };

            (mockConfigService.get as Mock).mockReturnValue(mockStore);
            (mockConfigService.getOrThrow as Mock).mockReturnValue(443);

            const result = service.getServerIps();

            expect(result.urls).toHaveLength(7); // Default + LAN IPv4 + LAN IPv6 + LAN Name + LAN MDNS + 2 FQDN
            expect(result.errors).toHaveLength(0);

            // Verify default URL
            const defaultUrl = result.urls.find((url) => url.type === URL_TYPE.DEFAULT);
            expect(defaultUrl).toBeDefined();
            expect(defaultUrl?.ipv4?.toString()).toBe('https://default.unraid.net/');

            // Verify LAN IPv4 URL
            const lanIp4Url = result.urls.find(
                (url) => url.type === URL_TYPE.LAN && url.name === 'LAN IPv4'
            );
            expect(lanIp4Url).toBeDefined();
            expect(lanIp4Url?.ipv4?.toString()).toBe('https://192.168.1.1/');

            // Verify LAN IPv6 URL
            const lanIp6Url = result.urls.find(
                (url) => url.type === URL_TYPE.LAN && url.name === 'LAN IPv6'
            );
            expect(lanIp6Url).toBeDefined();
            expect(lanIp6Url?.ipv6?.toString()).toBe('https://ipv6.unraid.local/');

            // Verify LAN Name URL
            const lanNameUrl = result.urls.find(
                (url) => url.type === URL_TYPE.MDNS && url.name === 'LAN Name'
            );
            expect(lanNameUrl).toBeDefined();
            expect(lanNameUrl?.ipv4?.toString()).toBe('https://unraid.local/');

            // Verify LAN MDNS URL
            const lanMdnsUrl = result.urls.find(
                (url) => url.type === URL_TYPE.MDNS && url.name === 'LAN MDNS'
            );
            expect(lanMdnsUrl).toBeDefined();
            expect(lanMdnsUrl?.ipv4?.toString()).toBe('https://unraid.local/');

            // Verify FQDN URLs
            const lanFqdnUrl = result.urls.find(
                (url) => url.type === URL_TYPE.LAN && url.name === 'FQDN LAN'
            );
            expect(lanFqdnUrl).toBeDefined();
            expect(lanFqdnUrl?.ipv4?.toString()).toBe('https://lan.unraid.net/');

            const wanFqdnUrl = result.urls.find(
                (url) => url.type === URL_TYPE.WAN && url.name === 'FQDN WAN'
            );
            expect(wanFqdnUrl).toBeDefined();
            expect(wanFqdnUrl?.ipv4?.toString()).toBe('https://wan.unraid.net/');
        });
    });

    describe('getRemoteAccessUrl', () => {
        it('should return WAN URL when available', () => {
            const mockStore = {
                emhttp: {
                    nginx: {
                        defaultUrl: 'https://default.unraid.net',
                        lanIp: '192.168.1.1',
                        lanIp6: '2001:db8::1',
                        lanName: 'unraid.local',
                        lanMdns: 'unraid.local',
                        sslEnabled: true,
                        sslMode: 'yes',
                        httpPort: 80,
                        httpsPort: 443,
                        fqdnUrls: [
                            {
                                interface: 'WAN',
                                id: null,
                                fqdn: 'wan.unraid.net',
                                isIpv6: false,
                            },
                        ],
                    },
                },
            };

            (mockConfigService.get as Mock).mockReturnValue(mockStore);
            (mockConfigService.getOrThrow as Mock).mockReturnValue(443);

            const result = service.getRemoteAccessUrl();

            expect(result).toBeDefined();
            expect(result?.type).toBe(URL_TYPE.WAN);
            expect(result?.ipv4?.toString()).toBe('https://wan.unraid.net/');
        });

        it('should return null when no WAN URL is available', () => {
            const mockStore = {
                emhttp: {
                    nginx: {
                        defaultUrl: 'https://default.unraid.net',
                        lanIp: '192.168.1.1',
                        lanIp6: '2001:db8::1',
                        lanName: 'unraid.local',
                        lanMdns: 'unraid.local',
                        sslEnabled: true,
                        sslMode: 'yes',
                        httpPort: 80,
                        httpsPort: 443,
                        fqdnUrls: [],
                    },
                },
            };

            (mockConfigService.get as Mock).mockReturnValue(mockStore);

            const result = service.getRemoteAccessUrl();

            expect(result).toBeNull();
        });
    });
});
