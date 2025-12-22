import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { type Cache } from 'cache-manager';

import { TailscaleStatus } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { getDockerClient } from '@app/unraid-api/graph/resolvers/docker/utils/docker-client.js';

interface RawTailscaleStatus {
    Self: {
        Online: boolean;
        DNSName: string;
        TailscaleIPs?: string[];
        Relay?: string;
        PrimaryRoutes?: string[];
        ExitNodeOption?: boolean;
        KeyExpiry?: string;
    };
    ExitNodeStatus?: {
        Online: boolean;
        TailscaleIPs?: string[];
    };
    Version: string;
    BackendState?: string;
    AuthURL?: string;
}

interface DerpRegion {
    RegionCode: string;
    RegionName: string;
}

interface DerpMap {
    Regions: Record<string, DerpRegion>;
}

interface TailscaleVersionResponse {
    TarballsVersion: string;
}

@Injectable()
export class DockerTailscaleService {
    private readonly logger = new Logger(DockerTailscaleService.name);
    private readonly docker = getDockerClient();

    private static readonly DERP_MAP_CACHE_KEY = 'tailscale_derp_map';
    private static readonly VERSION_CACHE_KEY = 'tailscale_latest_version';
    private static readonly STATUS_CACHE_PREFIX = 'tailscale_status_';
    private static readonly DERP_MAP_TTL = 86400000; // 24 hours in ms
    private static readonly VERSION_TTL = 86400000; // 24 hours in ms
    private static readonly STATUS_TTL = 30000; // 30 seconds in ms

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async getTailscaleStatus(
        containerName: string,
        labels: Record<string, string>,
        forceRefresh = false
    ): Promise<TailscaleStatus | null> {
        const hostname = labels['net.unraid.docker.tailscale.hostname'];
        const webUiTemplate = labels['net.unraid.docker.tailscale.webui'];

        const cacheKey = `${DockerTailscaleService.STATUS_CACHE_PREFIX}${containerName}`;

        if (forceRefresh) {
            await this.cacheManager.del(cacheKey);
        } else {
            const cached = await this.cacheManager.get<TailscaleStatus>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const rawStatus = await this.execTailscaleStatus(containerName);
        if (!rawStatus) {
            // Don't cache failures - return without caching so next request retries
            return {
                online: false,
                hostname: hostname || undefined,
                isExitNode: false,
                updateAvailable: false,
                keyExpired: false,
            };
        }

        const [derpMap, latestVersion] = await Promise.all([this.getDerpMap(), this.getLatestVersion()]);

        const version = rawStatus.Version?.split('-')[0];
        const updateAvailable = Boolean(
            version && latestVersion && this.isVersionLessThan(version, latestVersion)
        );

        const dnsName = rawStatus.Self.DNSName;

        let relayName: string | undefined;
        if (rawStatus.Self.Relay && derpMap) {
            relayName = this.mapRelayToRegion(rawStatus.Self.Relay, derpMap);
        }

        let keyExpiry: Date | undefined;
        let keyExpiryDays: number | undefined;
        let keyExpired = false;

        if (rawStatus.Self.KeyExpiry) {
            keyExpiry = new Date(rawStatus.Self.KeyExpiry);
            const now = new Date();
            const diffMs = keyExpiry.getTime() - now.getTime();
            keyExpiryDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            keyExpired = diffMs < 0;
        }

        const webUiUrl = webUiTemplate ? this.resolveWebUiUrl(webUiTemplate, rawStatus) : undefined;

        const status: TailscaleStatus = {
            online: rawStatus.Self.Online,
            version,
            latestVersion: latestVersion ?? undefined,
            updateAvailable,
            hostname,
            dnsName: dnsName || undefined,
            relay: rawStatus.Self.Relay,
            relayName,
            tailscaleIps: rawStatus.Self.TailscaleIPs,
            primaryRoutes: rawStatus.Self.PrimaryRoutes,
            isExitNode: Boolean(rawStatus.Self.ExitNodeOption),
            exitNodeStatus: rawStatus.ExitNodeStatus
                ? {
                      online: rawStatus.ExitNodeStatus.Online,
                      tailscaleIps: rawStatus.ExitNodeStatus.TailscaleIPs,
                  }
                : undefined,
            webUiUrl,
            keyExpiry,
            keyExpiryDays,
            keyExpired,
            backendState: rawStatus.BackendState,
            authUrl: rawStatus.AuthURL,
        };

        await this.cacheManager.set(cacheKey, status, DockerTailscaleService.STATUS_TTL);

        return status;
    }

    async getDerpMap(): Promise<DerpMap | null> {
        const cached = await this.cacheManager.get<DerpMap>(DockerTailscaleService.DERP_MAP_CACHE_KEY);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch('https://login.tailscale.com/derpmap/default', {
                signal: AbortSignal.timeout(3000),
            });

            if (!response.ok) {
                this.logger.warn(`Failed to fetch DERP map: ${response.status}`);
                return null;
            }

            const data = (await response.json()) as DerpMap;
            await this.cacheManager.set(
                DockerTailscaleService.DERP_MAP_CACHE_KEY,
                data,
                DockerTailscaleService.DERP_MAP_TTL
            );
            return data;
        } catch (error) {
            this.logger.warn('Failed to fetch DERP map', error);
            return null;
        }
    }

    async getLatestVersion(): Promise<string | null> {
        const cached = await this.cacheManager.get<string>(DockerTailscaleService.VERSION_CACHE_KEY);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch('https://pkgs.tailscale.com/stable/?mode=json', {
                signal: AbortSignal.timeout(3000),
            });

            if (!response.ok) {
                this.logger.warn(`Failed to fetch Tailscale version: ${response.status}`);
                return null;
            }

            const data = (await response.json()) as TailscaleVersionResponse;
            const version = data.TarballsVersion;
            await this.cacheManager.set(
                DockerTailscaleService.VERSION_CACHE_KEY,
                version,
                DockerTailscaleService.VERSION_TTL
            );
            return version;
        } catch (error) {
            this.logger.warn('Failed to fetch Tailscale version', error);
            return null;
        }
    }

    private async execTailscaleStatus(containerName: string): Promise<RawTailscaleStatus | null> {
        try {
            const cleanName = containerName.replace(/^\//, '');
            const container = this.docker.getContainer(cleanName);

            const exec = await container.exec({
                Cmd: ['/bin/sh', '-c', 'tailscale status --json'],
                AttachStdout: true,
                AttachStderr: true,
            });

            const stream = await exec.start({ hijack: true, stdin: false });
            const output = await this.collectStreamOutput(stream);

            this.logger.debug(`Raw tailscale output for ${cleanName}: ${output.substring(0, 500)}...`);

            if (!output.trim()) {
                this.logger.warn(`Empty tailscale output for ${cleanName}`);
                return null;
            }

            const parsed = JSON.parse(output) as RawTailscaleStatus;
            this.logger.debug(
                `Parsed tailscale status for ${cleanName}: DNSName=${parsed.Self?.DNSName}, Online=${parsed.Self?.Online}`
            );
            return parsed;
        } catch (error) {
            this.logger.debug(`Failed to get Tailscale status for ${containerName}: ${error}`);
            return null;
        }
    }

    private async collectStreamOutput(stream: NodeJS.ReadableStream): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });
            stream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const output = this.demuxDockerStream(buffer);
                resolve(output);
            });
            stream.on('error', reject);
        });
    }

    private demuxDockerStream(buffer: Buffer): string {
        // Check if the buffer looks like it starts with JSON (not multiplexed)
        // Docker multiplexed streams start with stream type byte (0, 1, or 2)
        // followed by 3 zero bytes, then 4-byte size
        if (buffer.length > 0) {
            const firstChar = buffer.toString('utf8', 0, 1);
            if (firstChar === '{' || firstChar === '[') {
                // Already plain text/JSON, not multiplexed
                return buffer.toString('utf8');
            }
        }

        let offset = 0;
        const output: string[] = [];

        while (offset < buffer.length) {
            if (offset + 8 > buffer.length) break;

            const streamType = buffer.readUInt8(offset);
            // Valid stream types are 0 (stdin), 1 (stdout), 2 (stderr)
            if (streamType > 2) {
                // Doesn't look like multiplexed stream, treat as raw
                return buffer.toString('utf8');
            }

            const size = buffer.readUInt32BE(offset + 4);
            offset += 8;

            if (offset + size > buffer.length) break;

            const chunk = buffer.slice(offset, offset + size).toString('utf8');
            output.push(chunk);
            offset += size;
        }

        return output.join('');
    }

    private mapRelayToRegion(relayCode: string, derpMap: DerpMap): string | undefined {
        for (const region of Object.values(derpMap.Regions)) {
            if (region.RegionCode === relayCode) {
                return region.RegionName;
            }
        }
        return undefined;
    }

    private isVersionLessThan(current: string, latest: string): boolean {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);

        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const curr = currentParts[i] || 0;
            const lat = latestParts[i] || 0;
            if (curr < lat) return true;
            if (curr > lat) return false;
        }
        return false;
    }

    private resolveWebUiUrl(template: string, status: RawTailscaleStatus): string | undefined {
        if (!template) return undefined;

        let url = template;
        const dnsName = status.Self.DNSName?.replace(/\.$/, '');

        // Handle [hostname][magicdns] or [hostname] - use MagicDNS name and port 443
        if (url.includes('[hostname]')) {
            if (dnsName) {
                // Replace [hostname][magicdns] with the full DNS name
                url = url.replace('[hostname][magicdns]', dnsName);
                // Replace standalone [hostname] with the DNS name
                url = url.replace('[hostname]', dnsName);
                // When using MagicDNS, also replace [IP] with DNS name
                url = url.replace(/\[IP\]/g, dnsName);
                // When using MagicDNS with Serve/Funnel, port is always 443
                url = url.replace(/\[PORT:\d+\]/g, '443');
            } else {
                // DNS name not available, can't resolve
                return undefined;
            }
        } else if (url.includes('[noserve]')) {
            // Handle [noserve] - use direct Tailscale IP
            const ipv4 = status.Self.TailscaleIPs?.find((ip) => !ip.includes(':'));
            if (ipv4) {
                const portMatch = template.match(/\[PORT:(\d+)\]/);
                const port = portMatch ? `:${portMatch[1]}` : '';
                url = `http://${ipv4}${port}`;
            } else {
                return undefined;
            }
        } else {
            // Custom URL - just do basic replacements
            if (url.includes('[IP]') && status.Self.TailscaleIPs?.[0]) {
                const ipv4 = status.Self.TailscaleIPs.find((ip) => !ip.includes(':'));
                url = url.replace(/\[IP\]/g, ipv4 || status.Self.TailscaleIPs[0]);
            }

            const portMatch = url.match(/\[PORT:(\d+)\]/);
            if (portMatch) {
                url = url.replace(portMatch[0], portMatch[1]);
            }
        }

        return url;
    }
}
