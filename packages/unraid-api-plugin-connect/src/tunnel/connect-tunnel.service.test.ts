import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { Server } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { plainToInstance } from 'class-transformer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCertificate } from '../__test__/certificate.fixture.js';
import { ConnectConfigPersister } from '../config/config.persistence.js';
import { emptyMyServersConfig } from '../config/connect.config.js';
import { ConnectConfigService } from '../config/connect.config.service.js';
import { CloudResolver } from '../connection-status/cloud.resolver.js';
import { CloudService } from '../connection-status/cloud.service.js';
import { ConnectStatusWriterService } from '../connection-status/connect-status-writer.service.js';
import { DnsService } from '../network/dns.service.js';
import { NetworkService } from '../network/network.service.js';
import { UpnpService } from '../network/upnp.service.js';
import { UrlResolverService } from '../network/url-resolver.service.js';
import { RemoteAccessService } from '../remote-access/remote-access.service.js';
import { ConnectSettingsService } from '../unraid-connect/connect-settings.service.js';
import { ConnectTunnelSettingsResolver } from './connect-tunnel-settings.resolver.js';
import { ConnectTunnelService, parseEntitlement } from './connect-tunnel.service.js';
import { ConnectGatewayService, validateGatewayServices } from './gateway-settings.js';

const hostname = `tun-${'a'.repeat(32)}.example.myunraid.net`;

const validEntitlement = (overrides: Record<string, unknown> = {}) => ({
    schema_version: 1,
    tier: 'starter',
    access_state: 'available',
    reason: null,
    status: 'active',
    rate_mode: 'limited',
    rate_bytes_per_second: 500000,
    quota_mode: 'limited',
    bytes_used: 125,
    quota_bytes: 1000,
    bytes_remaining: 875,
    policy_revision: 1,
    period_start: 1785542400,
    period_end: 1788220800,
    usage_updated_at: 1787523507131,
    ...overrides,
});

describe('parseEntitlement', () => {
    it.each([
        validEntitlement({ status: 'inactive' }),
        validEntitlement({ access_state: 'unknown' }),
        validEntitlement({ access_state: 'blocked', reason: 'entitlement_inactive' }),
        validEntitlement({
            bytes_used: 1000,
            bytes_remaining: 0,
            access_state: 'available',
            reason: null,
        }),
        validEntitlement({ tier: '' }),
        validEntitlement({ policy_revision: -1 }),
    ])('rejects an impossible or incomplete v1 snapshot', (snapshot) => {
        expect(parseEntitlement(snapshot)).toBeNull();
    });

    it.each([
        validEntitlement(),
        validEntitlement({
            rate_mode: 'unlimited',
            rate_bytes_per_second: 0,
            quota_mode: 'unlimited',
            quota_bytes: 0,
            bytes_remaining: null,
        }),
        validEntitlement({
            bytes_used: 1000,
            bytes_remaining: 0,
            access_state: 'blocked',
            reason: 'quota_exhausted',
        }),
        validEntitlement({
            status: 'inactive',
            access_state: 'blocked',
            reason: 'entitlement_inactive',
        }),
        validEntitlement({ status: 'unknown', access_state: 'unknown' }),
    ])('accepts a valid connector v1 snapshot', (snapshot) => {
        expect(parseEntitlement(snapshot)).not.toBeNull();
    });
});

describe('native connector host integration', () => {
    let directory: string;
    let config: ConfigService;
    let persister: ConnectConfigPersister;
    let tunnel: ConnectTunnelService;
    let server: Server;
    let requests: string[];
    let responseStatus: number;
    let responseHostname: string;
    let serviceIds: string[];
    let serviceRequests: unknown[];
    let serviceStatus: number;
    let nginx: { reload: ReturnType<typeof vi.fn> };
    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'connect-host-'));
        requests = [];
        responseStatus = 200;
        responseHostname = hostname;
        serviceIds = [];
        serviceRequests = [];
        serviceStatus = 200;
        server = createServer(async (request, response) => {
            requests.push(`${request.method} ${request.url}`);
            expect(request.headers['x-api-key']).toBe('test-key');
            if (request.url === '/tunnel/services') {
                let body = '';
                for await (const chunk of request) body += chunk;
                const input = JSON.parse(body);
                serviceRequests.push(input);
                if (serviceStatus === 200) serviceIds = input.serviceIds;
            }
            response.writeHead(request.url === '/tunnel/services' ? serviceStatus : responseStatus, {
                'Content-Type': 'application/json',
            });
            response.end(
                JSON.stringify(
                    ['/tunnel/enable', '/tunnel/routes', '/tunnel/services'].includes(request.url ?? '')
                        ? {
                              version: 1,
                              serviceRoutesSupported: true,
                              hostname: responseHostname,
                              routes: [
                                  ...serviceIds.map((id) => ({
                                      id,
                                      purpose: id,
                                      kind: 'service',
                                      enabled: true,
                                      hostname: `tun-${'c'.repeat(32)}-${id.slice(4)}.example.myunraid.net`,
                                  })),
                                  {
                                      id: 'webgui',
                                      purpose: 'webgui',
                                      kind: 'dynamic',
                                      enabled: true,
                                      hostname: responseHostname,
                                  },
                                  {
                                      id: 'webgui',
                                      purpose: 'webgui',
                                      kind: 'stable',
                                      enabled: true,
                                      hostname: responseHostname.replace(
                                          /^tun-[^.]+/,
                                          `srv-${'b'.repeat(32)}`
                                      ),
                                  },
                              ],
                          }
                        : request.url === '/tunnel/disable'
                          ? { removed: 1 }
                          : request.method === 'POST'
                            ? { enabled: true }
                            : { removed: true }
                )
            );
        });
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Missing test port');
        const executable = join(directory, 'connector');
        await writeFile(
            executable,
            `#!${process.execPath}\nconsole.log(JSON.stringify({event:'presence_connected', apiKey:process.env.API_KEY}));\nsetInterval(()=>{},1000);\n`,
            { mode: 0o755 }
        );
        const provisioner = join(directory, 'ProvisionCert.php');
        await writeFile(
            provisioner,
            'Certificate provisioning and renewal are owned by the installed Connect plugin.'
        );
        config = new ConfigService({
            UNRAID_PREVIEW: true,
            PATHS_CONFIG_MODULES: directory,
            CONNECT_CONTROL_PLANE_URL: `http://127.0.0.1:${address.port}`,
            CONNECT_CONNECTOR_PATH: executable,
            CONNECT_CERT_BUNDLE_PATH: makeCertificate(directory),
            CONNECT_CERT_PROVISIONER_PATH: provisioner,
            connect: { config: { ...emptyMyServersConfig(), apikey: 'test-key' } },
            store: {
                emhttp: {
                    var: { name: 'Tower', version: '7.2.0' },
                    disks: [],
                    nginx: {
                        sslEnabled: true,
                        sslMode: 'auto',
                        httpsPort: 443,
                        httpPort: 80,
                        lanIp: '192.168.1.2',
                        fqdnUrls: [
                            {
                                interface: 'LAN',
                                id: null,
                                isIpv6: false,
                                fqdn: '192-168-1-2.example.myunraid.net',
                            },
                        ],
                    },
                },
            },
        });
        persister = new ConnectConfigPersister(config);
        await persister.save(persister.getConfig());
        nginx = { reload: vi.fn().mockResolvedValue(true) };
        tunnel = new ConnectTunnelService(
            config,
            persister,
            new UrlResolverService(config),
            new EventEmitter2(),
            nginx
        );
    });
    afterEach(async () => {
        await tunnel.onModuleDestroy();
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        );
        await rm(directory, { recursive: true, force: true });
    });
    const setFeatures = async (features: object) => {
        const target = tunnel;
        const store = persister;
        await store.save(await store.validate({ ...target.settings(), ...features }));
    };
    it('collects only aggregate Docker and VM state for the shared overview', async () => {
        const query = vi
            .fn()
            .mockResolvedValueOnce({
                data: { docker: { containers: [{ state: 'RUNNING' }, { state: 'EXITED' }] } },
            })
            .mockResolvedValueOnce({
                data: { vms: { domains: [{ state: 'RUNNING' }, { state: 'SHUTOFF' }] } },
            });
        Object.assign(tunnel, {
            internalClient: { getClient: vi.fn().mockResolvedValue({ query }) },
        });

        const snapshot = await tunnel.preview();

        expect(snapshot.workloads).toEqual({
            docker: { state: 'available', running: 1, stopped: 1, paused: 0, total: 2 },
            virtualMachines: {
                state: 'available',
                running: 1,
                stopped: 1,
                paused: 0,
                total: 2,
            },
        });
        expect(query).toHaveBeenCalledTimes(2);
        expect(JSON.stringify(snapshot.workloads)).not.toMatch(/name|id|image/i);
    });
    it('backfills authoritative aliases for an already-enabled installation', async () => {
        await setFeatures({
            certificateManagementEnabled: true,
            tunnelRemoteAccessEnabled: true,
            tunnelHostname: hostname,
            tunnelHostnames: [],
        });
        await tunnel.start();
        expect(requests).toContain('GET /tunnel/routes');
        expect(tunnel.settings().tunnelHostnames).toEqual([
            hostname,
            `srv-${'b'.repeat(32)}.example.myunraid.net`,
        ]);
        expect(tunnel.status().routeState).toBe('ready');
        expect((await tunnel.processEnvironment())?.GATEWAY_CONFIG).toBeUndefined();
        expect(nginx.reload).toHaveBeenCalled();
    });
    it('retries nginx application after aliases were persisted but reload failed', async () => {
        await setFeatures({
            certificateManagementEnabled: true,
            tunnelRemoteAccessEnabled: true,
            tunnelHostname: hostname,
            tunnelHostnames: [],
        });
        nginx.reload.mockResolvedValueOnce(false).mockResolvedValue(true);
        await tunnel.start();
        expect(tunnel.status().routeState).toBe('unavailable');
        expect(tunnel.settings().tunnelHostnames).toHaveLength(2);
        await (tunnel as unknown as { refreshAliases(): Promise<void> }).refreshAliases();
        expect(nginx.reload).toHaveBeenCalledTimes(2);
        expect(tunnel.status().routeState).toBe('ready');
    });
    it.each([403, 409, 503])(
        'shows an alias refresh failure and clears only authoritative refusals (%s)',
        async (status) => {
            await setFeatures({
                certificateManagementEnabled: true,
                tunnelRemoteAccessEnabled: true,
                tunnelHostname: hostname,
                tunnelHostnames: [hostname],
            });
            responseStatus = status;
            await tunnel.start();
            expect(tunnel.status().routeState).toBe('unavailable');
            expect(tunnel.settings().tunnelHostnames).toEqual(status === 503 ? [hostname] : []);
            expect(tunnel.settings().tunnelHostname).toBe(status === 503 ? hostname : null);
        }
    );
    it('projects gateway certificate and route failures without leaking diagnostics', async () => {
        const accept = tunnel as unknown as { acceptStatus(line: string): void };
        accept.acceptStatus(
            JSON.stringify({
                event: 'gateway_status',
                state: 'unavailable',
                reason: 'certificate_unavailable',
            })
        );
        expect(tunnel.status()).toMatchObject({
            gateway: 'unavailable',
            gatewayReason: 'certificate_unavailable',
        });
        accept.acceptStatus(
            JSON.stringify({ event: 'gateway_status', state: 'stale', reason: 'route_refresh_failed' })
        );
        expect(tunnel.status()).toMatchObject({
            gateway: 'stale',
            gatewayReason: 'route_refresh_failed',
        });
        accept.acceptStatus(JSON.stringify({ event: 'gateway_status', state: 'ready', reason: '' }));
        expect(tunnel.status()).toMatchObject({ gateway: 'ready', gatewayReason: '' });
    });
    it('generates an opt-in gateway config and preserves both webgui aliases', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await Promise.all(
            ['connect-gateway-v2.json', 'connect-gateway-v3.json'].map((name) =>
                writeFile(join(directory, name), 'legacy gateway config')
            )
        );
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        expect(tunnel.settings().tunnelHostnames).toEqual([
            hostname,
            `srv-${'b'.repeat(32)}.example.myunraid.net`,
        ]);
        const env = await tunnel.processEnvironment();
        const path = env?.GATEWAY_CONFIG;
        expect(path).toBeTruthy();
        expect(JSON.parse(await readFile(path!, 'utf8'))).toEqual({
            version: 1,
            gatewayServicesRevision: 0,
            issuer: 'https://account.unraid.net',
            clientId: 'CONNECT_SERVER_SSO',
            services: [
                {
                    purpose: 'webgui',
                    upstream: 'http://127.0.0.1:80',
                    auth: 'upstream',
                },
            ],
        });
        await expect(readFile(join(directory, 'connect-gateway-v2.json'))).rejects.toThrow();
        await expect(readFile(join(directory, 'connect-gateway-v3.json'))).rejects.toThrow();
        await tunnel.update({ tunnelRemoteAccessEnabled: false });
        expect(tunnel.settings().tunnelHostnames).toEqual([]);
        expect((await tunnel.processEnvironment())?.GATEWAY_CONFIG).toBeUndefined();
    });
    const appService = {
        id: 'app-0123456789abcdef',
        name: 'Media',
        upstream: 'http://127.0.0.1:32400',
        tlsServerName: '',
        enabled: true,
    };
    it('writes delegated provider IDs and subjects locally without sending them to cloud routes', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        const service = {
            ...appService,
            auth: 'oidc' as const,
            providerId: 'configured',
            subjects: ['viewer'],
        };
        await tunnel.updateGatewayServices({ expectedRevision: 0, services: [service] });
        const env = await tunnel.processEnvironment();
        const generated = JSON.parse(await readFile(env!.GATEWAY_CONFIG!, 'utf8'));
        expect(generated.oidcCallbackOrigin).toBe(`https://${tunnel.settings().tunnelHostname}`);
        expect(generated.oidcProviders).toBeUndefined();
        expect(env?.OIDC_CONFIG_PATH).toBe(join(directory, 'oidc.json'));
        expect(generated.services).toContainEqual({
            purpose: service.id,
            upstream: service.upstream,
            auth: 'oidc',
            providerId: 'configured',
            subjects: ['viewer'],
        });
        expect(serviceRequests).toEqual([{ serviceIds: [appService.id] }]);
        expect(tunnel.gatewaySettings().callbackUrl).toBe(
            `${generated.oidcCallbackOrigin}/_connect/oidc/callback`
        );
        for (const invalid of [
            { ...service, providerId: '' },
            { ...service, auth: 'upstream' },
            { ...service, subjects: [null] },
        ]) {
            expect(() => validateGatewayServices([invalid as ConnectGatewayService])).toThrow();
        }
    });
    it('writes Minecraft Java as an application-authenticated raw TCP route', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        const minecraft = {
            ...appService,
            name: 'Minecraft',
            upstream: 'tcp://127.0.0.1:25565',
            protocol: 'tcp' as const,
            ingress: 'minecraft-java' as const,
            auth: 'upstream' as const,
        };
        await tunnel.updateGatewayServices({ expectedRevision: 0, services: [minecraft] });
        const env = await tunnel.processEnvironment();
        const generated = JSON.parse(await readFile(env!.GATEWAY_CONFIG!, 'utf8'));
        expect(generated.services).toContainEqual({
            purpose: minecraft.id,
            protocol: 'tcp',
            ingress: 'minecraft-java',
            upstream: minecraft.upstream,
            auth: 'upstream',
        });
        expect(tunnel.gatewaySettings().services[0]?.url).toMatch(/:25565$/);

        for (const invalid of [
            { ...minecraft, auth: 'account' },
            { ...minecraft, upstream: 'http://127.0.0.1:25565' },
            { ...minecraft, protocol: 'minecraft-java' },
            { ...minecraft, ingress: '' },
        ]) {
            expect(() => validateGatewayServices([invalid as ConnectGatewayService])).toThrow();
        }
    });
    it('writes TLS TCP as a managed-TLS private TCP route', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        const mqtt = {
            ...appService,
            name: 'MQTT',
            upstream: 'tcp://127.0.0.1:1883',
            protocol: 'tcp' as const,
            ingress: 'tls-sni' as const,
            auth: 'upstream' as const,
        };
        await tunnel.updateGatewayServices({ expectedRevision: 0, services: [mqtt] });
        const env = await tunnel.processEnvironment();
        const generated = JSON.parse(await readFile(env!.GATEWAY_CONFIG!, 'utf8'));
        expect(generated.services).toContainEqual({
            purpose: mqtt.id,
            protocol: 'tcp',
            ingress: 'tls-sni',
            upstream: mqtt.upstream,
            auth: 'upstream',
        });
        expect(tunnel.gatewaySettings().services[0]?.url).toMatch(/:443$/);

        for (const invalid of [
            { ...mqtt, auth: 'account' },
            { ...mqtt, upstream: 'https://127.0.0.1:1883' },
            { ...mqtt, upstream: 'tcp://8.8.8.8:1883' },
        ]) {
            expect(() => validateGatewayServices([invalid as ConnectGatewayService])).toThrow();
        }
    });
    it('isolates gateway state but keeps the server-owned OIDC configuration', async () => {
        const connectPath = join(directory, 'preview', 'connect.json');
        config.set('CONNECT_CONFIG_PATH', connectPath);
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        await tunnel.updateGatewayServices({
            expectedRevision: 0,
            services: [{ ...appService, auth: 'oidc', providerId: 'configured', subjects: [] }],
        });
        const env = await tunnel.processEnvironment();
        expect(env?.GATEWAY_CONFIG).toBe(join(directory, 'preview', 'connect-gateway-v1.json'));
        expect(env?.OIDC_CONFIG_PATH).toBe(join(directory, 'oidc.json'));
    });
    it('stops and rebuilds delegated auth after provider settings persist', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        await tunnel.updateGatewayServices({
            expectedRevision: 0,
            services: [
                {
                    ...appService,
                    auth: 'oidc',
                    providerId: 'configured',
                    subjects: [],
                },
            ],
        });
        const stopSpy = vi.spyOn(tunnel as any, 'stopChild');
        vi.spyOn(tunnel, 'processEnvironment').mockRejectedValueOnce(
            new Error('replacement provider config rejected')
        );
        await expect(tunnel.onOidcProvidersPersisted()).rejects.toThrow(
            'replacement provider config rejected'
        );
        expect(stopSpy).toHaveBeenCalled();
        expect((tunnel as any).child).toBeUndefined();
    });
    it('publishes only opaque service IDs and writes local targets with Account protection', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        await tunnel.updateGatewayServices({ expectedRevision: 0, services: [appService] });
        expect(serviceRequests).toEqual([{ serviceIds: [appService.id] }]);
        expect(tunnel.gatewaySettings()).toMatchObject({
            revision: 1,
            pending: false,
            services: [
                {
                    ...appService,
                    url: `https://tun-${'c'.repeat(32)}-0123456789abcdef.example.myunraid.net`,
                },
            ],
        });
        const env = await tunnel.processEnvironment();
        if (!env?.GATEWAY_CONFIG) throw new Error('Missing generated gateway config');
        const generated = JSON.parse(await readFile(env!.GATEWAY_CONFIG!, 'utf8'));
        expect(generated.services).toContainEqual({
            purpose: appService.id,
            upstream: appService.upstream,
            auth: 'account',
        });
        expect(env.OIDC_CONFIG_PATH).toBe(join(directory, 'oidc.json'));
        expect(tunnel.settings().tunnelHostnames).toHaveLength(2);
        expect(tunnel.settings().gatewayServiceRoutes).toEqual({
            [appService.id]: `tun-${'c'.repeat(32)}-0123456789abcdef.example.myunraid.net`,
        });
        await expect(
            tunnel.updateGatewayServices({ expectedRevision: 0, services: [] })
        ).rejects.toThrow();
        expect(serviceRequests).toHaveLength(1);
    });
    it('persists explicit app auth and keeps a switch back to Account after cloud failure', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        await tunnel.updateGatewayServices({
            expectedRevision: 0,
            services: [{ ...appService, auth: 'upstream' }],
        });
        const env = await tunnel.processEnvironment();
        if (!env?.GATEWAY_CONFIG) throw new Error('Missing generated gateway config');
        expect(JSON.parse(await readFile(env.GATEWAY_CONFIG, 'utf8')).services).toContainEqual({
            purpose: appService.id,
            upstream: appService.upstream,
            auth: 'upstream',
        });
        expect((await persister.validate(tunnel.settings())).gatewayServices[0].auth).toBe('upstream');
        serviceStatus = 502;
        await expect(
            tunnel.updateGatewayServices({
                expectedRevision: 1,
                services: [{ ...appService, auth: 'account' }],
            })
        ).rejects.toThrow();
        const updated = await tunnel.processEnvironment();
        if (!updated?.GATEWAY_CONFIG) throw new Error('Missing generated gateway config');
        expect(JSON.parse(await readFile(updated.GATEWAY_CONFIG, 'utf8')).services).toContainEqual({
            purpose: appService.id,
            upstream: appService.upstream,
            auth: 'account',
        });
        expect(tunnel.gatewaySettings()).toMatchObject({
            pending: true,
            services: [{ auth: 'account' }],
        });
        serviceStatus = 200;
        await tunnel.updateGatewayServices({ expectedRevision: 2, services: [appService] });
        expect(tunnel.gatewaySettings().pending).toBe(false);
    });
    it('defaults legacy settings to Account and rejects unknown or null authentication', async () => {
        expect(validateGatewayServices([appService])[0].auth).toBe('account');
        expect(validateGatewayServices([{ ...appService, auth: 'unraid' }])[0].auth).toBe('account');
        expect(
            (await persister.validate({ gatewayServices: [appService] })).gatewayServices[0].auth
        ).toBe('account');
        for (const auth of [null, 'none', 'public', '', false]) {
            const invalid = plainToInstance(ConnectGatewayService, { ...appService, auth });
            expect(() => validateGatewayServices([invalid])).toThrow();
            await expect(persister.validate({ gatewayServices: [invalid] })).rejects.toBeDefined();
        }
    });
    it('keeps removed targets absent after a cloud failure and retries the same desired set', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        await tunnel.updateGatewayServices({ expectedRevision: 0, services: [appService] });
        serviceStatus = 502;
        await expect(
            tunnel.updateGatewayServices({ expectedRevision: 1, services: [] })
        ).rejects.toThrow();
        expect(tunnel.gatewaySettings()).toMatchObject({ revision: 2, pending: true, services: [] });
        config.set('CONNECT_GATEWAY_ENABLED', 'false');
        const env = await tunnel.processEnvironment();
        if (!env?.GATEWAY_CONFIG) throw new Error('Missing generated gateway config');
        expect(JSON.parse(await readFile(env!.GATEWAY_CONFIG!, 'utf8')).services).toHaveLength(1);
        await expect(
            tunnel.updateGatewayServices({ expectedRevision: 2, services: [appService] })
        ).rejects.toThrow();
        serviceStatus = 200;
        await tunnel.updateGatewayServices({ expectedRevision: 2, services: [] });
        expect(tunnel.gatewaySettings()).toMatchObject({ revision: 3, pending: false });
        expect((await tunnel.processEnvironment())?.GATEWAY_CONFIG).toBeTruthy();
    });
    it('reconciles an empty desired set after removing the last service while disabled', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        await tunnel.updateGatewayServices({ expectedRevision: 0, services: [appService] });
        await tunnel.update({ tunnelRemoteAccessEnabled: false });
        await tunnel.updateGatewayServices({ expectedRevision: 1, services: [] });
        expect(serviceIds).toEqual([appService.id]);
        await tunnel.update({ tunnelRemoteAccessEnabled: true });
        expect(serviceIds).toEqual([]);
        expect(tunnel.gatewaySettings().pending).toBe(false);
    });
    it('keeps disabled drafts local while the parent tunnel is off', async () => {
        config.set('CONNECT_GATEWAY_ENABLED', 'true');
        await tunnel.updateGatewayServices({
            expectedRevision: 0,
            services: [{ ...appService, enabled: false }],
        });
        await tunnel.updateGatewayServices({ expectedRevision: 1, services: [] });
        expect(serviceRequests).toEqual([]);
        expect(tunnel.gatewaySettings().services).toEqual([]);
        expect((await tunnel.processEnvironment())?.GATEWAY_CONFIG).toBeUndefined();
    });
    it.each([
        'http://8.8.8.8',
        'http://host.local',
        'http://169.254.169.254',
        'ftp://127.0.0.1',
        'http://user:pass@127.0.0.1',
        'http://127.0.0.1/private',
        'http://127.0.0.1:0',
        'http://127.0.0.1/?token=secret',
    ])(
        'rejects unsafe service upstream %s before saving or requesting cloud changes',
        async (upstream) => {
            config.set('CONNECT_GATEWAY_ENABLED', 'true');
            await expect(
                tunnel.updateGatewayServices({
                    expectedRevision: 0,
                    services: [{ ...appService, upstream }],
                })
            ).rejects.toThrow();
            expect(tunnel.gatewaySettings().revision).toBe(0);
            expect(serviceRequests).toEqual([]);
        }
    );
    it('validates TLS names and service IDs without exposing an auth bypass', () => {
        expect(() => validateGatewayServices([{ ...appService, id: 'webgui' }])).toThrow();
        expect(() => validateGatewayServices([appService, appService])).toThrow();
        expect(() =>
            validateGatewayServices([
                { ...appService, upstream: 'https://127.0.0.1', tlsServerName: 'bad..name' },
            ])
        ).toThrow();
        expect(
            validateGatewayServices([
                { ...appService, upstream: 'https://[::1]:8443', tlsServerName: 'MEDIA.example.net' },
            ])[0].tlsServerName
        ).toBe('media.example.net');
    });
    it.each([
        { events: [], connected: false, error: null },
        { events: ['presence_connected'], connected: true, error: null },
        { events: ['connected'], connected: true, error: null },
        { events: ['presence_disconnected', 'presence_connected'], connected: true, error: null },
        { events: ['tunnel_retrying', 'connected'], connected: true, error: null },
        { events: ['connected', 'tunnel_idle'], connected: false, error: null },
        { events: ['presence_connected', 'tunnel_retrying'], connected: true, error: null },
        { events: ['connected', 'presence_disconnected'], connected: true, error: null },
        { events: ['presence_connected', 'refused'], connected: true, error: null },
        {
            events: ['presence_connected', 'presence_disconnected'],
            connected: false,
            error: 'presence_disconnected',
        },
        {
            events: ['connected', 'tunnel_retrying', 'tunnel_down'],
            connected: false,
            error: 'tunnel_retrying',
        },
    ])(
        'keeps certificate migration separate from connection events $events',
        async ({ events, connected, error }) => {
            const statuses = events.map((event) => ({ event }));
            await writeFile(
                join(directory, 'connector'),
                `#!${process.execPath}
for (const value of ${JSON.stringify(statuses)}) console.log(JSON.stringify(value));
console.log(JSON.stringify({event:'cert_installed', reason:'migrate'}));
setInterval(()=>{},1000);
`,
                { mode: 0o755 }
            );
            await setFeatures({ certificateManagementEnabled: true });
            await tunnel.start();
            await vi.waitFor(() => expect(tunnel.status().certificate).toBe('installed'));
            expect(nginx.reload).toHaveBeenCalledOnce();
            const cloud = new CloudService(tunnel);
            const resolver = new CloudResolver(
                cloud,
                new NetworkService(
                    nginx,
                    new DnsService(),
                    new UrlResolverService(config),
                    new ConnectConfigService(config)
                )
            );
            const result = await resolver.cloud();
            expect(result.minigraphql.status === 'CONNECTED').toBe(connected);
            expect(result.cloud.status === 'ok').toBe(connected);
            expect(result.relay?.status).toBe(connected ? 'connected' : 'disconnected');
            expect(result.cloud.error).toBe(error);
            expect(result.error ?? null).toBe(error);
            config.set('PATHS_CONNECT_STATUS_FILE_PATH', join(directory, 'connection-status.json'));
            const writer = new ConnectStatusWriterService(config);
            try {
                await writer.writeStatus();
                const written = JSON.parse(await readFile(writer.statusFilePath, 'utf8'));
                expect(written.connectionStatus === 'CONNECTED').toBe(connected);
                expect(written.error).toBe(error);
            } finally {
                await writer.onModuleDestroy();
            }
        }
    );
    it.each(['blocked', 'stale', 'recovered'] as const)(
        'projects native usage as %s independently from certificates',
        async (outcome) => {
            const snapshot = {
                schema_version: 1,
                tier: 'starter',
                access_state: 'blocked',
                reason: 'quota_exhausted',
                status: 'unknown',
                rate_mode: 'limited',
                rate_bytes_per_second: 500000,
                quota_mode: 'limited',
                bytes_used: 9745244848,
                quota_bytes: 1000000000,
                bytes_remaining: 0,
                policy_revision: 1,
                period_start: 1785542400,
                period_end: 1788220800,
                usage_updated_at: 1787523507131,
            };
            const events: object[] = [
                { event: 'presence_connected' },
                { event: 'entitlement_updated', entitlement: JSON.stringify(snapshot) },
                { event: 'tunnel_blocked', reason: 'quota_exhausted' },
            ];
            if (outcome === 'stale') events.push({ event: 'entitlement_unavailable' });
            if (outcome === 'recovered')
                events.push({
                    event: 'entitlement_updated',
                    entitlement: JSON.stringify({
                        ...snapshot,
                        access_state: 'unknown',
                        reason: null,
                        bytes_used: 0,
                        bytes_remaining: 1000000000,
                    }),
                });
            events.push({ event: 'cert_installed', reason: 'migrate' });
            await writeFile(
                join(directory, 'connector'),
                `#!${process.execPath}
for (const event of ${JSON.stringify(events)}) console.log(JSON.stringify(event));
setInterval(()=>{},1000);
`,
                { mode: 0o755 }
            );
            await setFeatures({ certificateManagementEnabled: true });
            await tunnel.start();
            await vi.waitFor(() => expect(tunnel.status().certificate).toBe('installed'));
            const status = tunnel.status();
            expect(status.entitlementState).toBe(outcome === 'stale' ? 'unavailable' : 'current');
            expect(status.entitlement?.bytesUsed).toBe(outcome === 'recovered' ? 0 : 9745244848);
            expect(status.entitlement?.rateBytesPerSecond).toBe(500000);
            expect(status.tunnelReason).toBe(outcome === 'recovered' ? '' : 'quota_exhausted');
            expect(new CloudService(tunnel).checkConnector().status).toBe('CONNECTED');
        }
    );
    const startCommandConnector = async (responseCode = '') => {
        await writeFile(
            config.getOrThrow<string>('CONNECT_CONNECTOR_PATH'),
            `#!${process.execPath}
const fs = require('node:fs');
const emit = (value) => console.log(JSON.stringify(value));
emit({event:'cert_commands_ready'});
require('node:readline').createInterface({input:process.stdin}).on('line', (line) => {
  const request = JSON.parse(line);
  fs.appendFileSync(${JSON.stringify(join(directory, 'commands'))}, line+'\\n');
  ${responseCode}
});
setInterval(()=>{},1000);
`,
            { mode: 0o755 }
        );
        await setFeatures({ certificateManagementEnabled: true });
        await tunnel.start();
        await vi.waitFor(async () =>
            expect((await tunnel.certificateMigration()).confirmationToken).toBeTruthy()
        );
        return (await tunnel.certificateMigration()).confirmationToken!;
    };
    it('sends one confirmed command to the running connector and correlates its result', async () => {
        const confirmation = await startCommandConnector(`
emit({event:'cert_migration_result', request_id:'0'.repeat(32), outcome:'failed', reason:'wrong_request'});
emit({event:'cert_command_rejected', request_id:request.request_id, reason:'duplicate_request'});
emit({event:'cert_migration_result', request_id:request.request_id, outcome:'installed', reason:'migrated'});`);
        const before = await tunnel.certificateMigration();
        await tunnel.migrateCertificate(confirmation);
        await vi.waitFor(async () =>
            expect((await tunnel.certificateMigration()).status).toBe('installed')
        );
        const lines = (await readFile(join(directory, 'commands'), 'utf8')).trim().split('\n');
        expect(lines).toHaveLength(1);
        expect(JSON.parse(lines[0])).toEqual({
            command: 'migrate_certificate',
            request_id: expect.stringMatching(/^[a-f0-9]{32}$/),
            fingerprint: before.fingerprint,
        });
        expect(lines[0]).not.toContain('test-key');
        expect(nginx.reload).toHaveBeenCalledOnce();
        expect((await tunnel.certificateMigration()).confirmationToken).toBeNull();
    });
    it('rejects changed certificates and certificates already owned by the connector', async () => {
        const confirmation = await startCommandConnector();
        const fingerprint = (await tunnel.certificateMigration()).fingerprint!;
        await writeFile(`${config.get('CONNECT_CERT_BUNDLE_PATH')}.csr-managed`, fingerprint + '\n');
        expect(await tunnel.certificateMigration()).toMatchObject({
            managed: true,
            confirmationToken: null,
        });
        await expect(tunnel.migrateCertificate(confirmation)).rejects.toThrow();
        await rm(`${config.get('CONNECT_CERT_BUNDLE_PATH')}.csr-managed`);
        makeCertificate(directory);
        await expect(tunnel.migrateCertificate(confirmation)).rejects.toThrow();
        await expect(readFile(join(directory, 'commands'))).rejects.toThrow();
    });
    it('rejects stale account/settings confirmations and never replays an interrupted request', async () => {
        const confirmation = await startCommandConnector();
        await tunnel.migrateCertificate(confirmation);
        await expect(tunnel.migrateCertificate(confirmation)).rejects.toThrow();
        await vi.waitFor(async () =>
            expect(await readFile(join(directory, 'commands'), 'utf8')).toContain('migrate_certificate')
        );
        await tunnel.update({ serverDataReportingEnabled: true });
        await vi.waitFor(async () =>
            expect((await tunnel.certificateMigration()).confirmationToken).toBeTruthy()
        );
        expect((await tunnel.certificateMigration()).status).toBe('interrupted');
        await expect(tunnel.migrateCertificate(confirmation)).rejects.toThrow();
        const next = (await tunnel.certificateMigration()).confirmationToken!;
        await tunnel.signOut();
        await tunnel.signIn('other-account', {
            preferred_username: 'Other',
            email: 'other@example.test',
        });
        await expect(tunnel.migrateCertificate(next)).rejects.toThrow();
        expect((await readFile(join(directory, 'commands'), 'utf8')).trim().split('\n')).toHaveLength(1);
    });
    it.each([true, false])(
        'refreshes HTTPS after partial installation (reload succeeds=%s)',
        async (reloaded) => {
            nginx.reload.mockResolvedValue(reloaded);
            const confirmation = await startCommandConnector(
                `emit({event:'cert_migration_result', request_id:request.request_id, outcome:'installed_unconfirmed', reason:'marker_failed'});`
            );
            await tunnel.migrateCertificate(confirmation);
            await vi.waitFor(async () =>
                expect((await tunnel.certificateMigration()).status).toBe('installed_unconfirmed')
            );
            expect(nginx.reload).toHaveBeenCalledOnce();
            expect((await tunnel.certificateMigration()).reason).toBe(
                reloaded ? 'marker_failed' : 'https_reload_failed'
            );
            await expect(tunnel.migrateCertificate(confirmation)).rejects.toThrow();
        }
    );
    it('reports a native failure without retrying, including when the command stream closes', async () => {
        const confirmation = await startCommandConnector(`
emit({event:'cert_commands_closed', reason:'eof'});
emit({event:'cert_migration_result', request_id:request.request_id, outcome:'failed', reason:'domain_changed'});`);
        await tunnel.migrateCertificate(confirmation);
        await vi.waitFor(async () =>
            expect((await tunnel.certificateMigration()).status).toBe('failed')
        );
        expect(await tunnel.certificateMigration()).toMatchObject({
            confirmationToken: null,
            reason: 'domain_changed',
        });
        expect(nginx.reload).not.toHaveBeenCalled();
        expect((await readFile(join(directory, 'commands'), 'utf8')).trim().split('\n')).toHaveLength(1);
    });
    it('does not launch or contact the service when all features are off', async () => {
        await tunnel.start();
        expect(await tunnel.processEnvironment()).toBeNull();
        expect(requests).toEqual([]);
    });
    it('accepts unchanged settings while signed out without contacting the connector service', async () => {
        await setFeatures({ apikey: '' });
        await tunnel.update({
            certificateManagementEnabled: false,
            tunnelRemoteAccessEnabled: false,
            serverDataReportingEnabled: false,
        });
        expect(requests).toEqual([]);
    });
    it('isolates certificate-only mode and supplies no host environment secrets', async () => {
        await setFeatures({ certificateManagementEnabled: true });
        const env = await tunnel.processEnvironment();
        expect(env).toMatchObject({ CERT_ONLY: 'true', CERT_ENABLED: 'true', API_KEY: 'test-key' });
        expect(env).not.toHaveProperty('TARGET_ADDR');
        expect(env).not.toHaveProperty('STATE_FILE');
        expect(env).not.toHaveProperty('HOME');
        expect(env).not.toHaveProperty('AWS_SECRET_ACCESS_KEY');
    });
    it('isolates the dedicated page from unified settings and clears overview data on opt-out', async () => {
        const settings = new UserSettingsService();
        const legacySettings = new ConnectSettingsService(
            config,
            tunnel,
            settings,
            new RemoteAccessService(
                config,
                persister,
                new UpnpService(
                    config,
                    { createMapping: vi.fn(), removeMapping: vi.fn(), getMappings: vi.fn() },
                    new SchedulerRegistry()
                ),
                { reloadNetworkStack: vi.fn() }
            )
        );
        await legacySettings.syncSettings({ tunnelRemoteAccessEnabled: true } as never);
        expect(tunnel.settings().tunnelRemoteAccessEnabled).toBe(false);
        const slice = await settings.getAllSettings();
        expect(slice.properties).not.toHaveProperty('connect');
        expect(slice.properties).toHaveProperty('remote-access');
        const page = new ConnectTunnelSettingsResolver(tunnel);
        const input = {
            certificateManagementEnabled: false,
            tunnelRemoteAccessEnabled: false,
            serverDataReportingEnabled: true,
        };
        await page.updateConnectTunnelSettings(input);
        expect(requests).toEqual(['POST /presence/state/enable']);
        expect(JSON.parse(await readFile(tunnel.statePath, 'utf8')).info.os.hostname).toBe('Tower');
        expect(await tunnel.processEnvironment()).toMatchObject({
            CERT_ENABLED: 'false',
            TARGET_ADDR: '127.0.0.1:1',
            STATE_FILE: tunnel.statePath,
        });
        expect(await tunnel.processEnvironment()).not.toHaveProperty('RELOAD_CMD');
        await vi.waitFor(() => expect(tunnel.status().presence).toBe('connected'));
        expect(await settings.getAllValues()).not.toHaveProperty('connect');
        expect(JSON.stringify(await page.connectTunnelSettings())).not.toContain('test-key');
        expect((await page.connectTunnelSettings()).previewMode).toBe(true);
        expect((await page.connectTunnelSettings()).overview).toHaveProperty(
            'info.os.hostname',
            'Tower'
        );
        await page.updateConnectTunnelSettings({ ...input, serverDataReportingEnabled: false });
        expect(requests.at(-1)).toBe('DELETE /presence/state');
        expect(tunnel.settings().serverDataRemoteCleared).toBe(true);
        expect(await readFile(tunnel.statePath, 'utf8')).not.toContain('Tower');
    });
    it('keeps sharing off locally if remote cleanup fails', async () => {
        await setFeatures({ serverDataReportingEnabled: true });
        await tunnel.start();
        responseStatus = 503;
        await expect(tunnel.update({ serverDataReportingEnabled: false })).rejects.toThrow();
        expect(tunnel.settings()).toMatchObject({
            serverDataReportingEnabled: false,
            serverDataRemoteCleared: false,
        });
        expect(await tunnel.processEnvironment()).toBeNull();
        expect(await readFile(tunnel.statePath, 'utf8')).not.toContain('Tower');
    });
    it('rolls back sharing if its acknowledgement is refused', async () => {
        responseStatus = 403;
        await expect(tunnel.update({ serverDataReportingEnabled: true })).rejects.toThrow();
        expect(tunnel.settings().serverDataReportingEnabled).toBe(false);
        expect(await tunnel.processEnvironment()).toBeNull();
    });
    it.each(['myunraid.net', 'preview.myunraid.net'])(
        'enables a certificate-covered %s tunnel and reloads nginx after persistence',
        async (domain) => {
            responseHostname = `tun-${'a'.repeat(32)}.example.${domain}`;
            makeCertificate(directory, `*.example.${domain}`);
            await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
            expect(tunnel.settings().tunnelHostname).toBe(responseHostname);
            expect(JSON.parse(await readFile(persister.configPath(), 'utf8')).tunnelHostname).toBe(
                responseHostname
            );
            expect(nginx.reload).toHaveBeenCalledOnce();
            expect(await tunnel.processEnvironment()).toMatchObject({
                TARGET_ADDR: '127.0.0.1:443',
                CERT_ENABLED: 'true',
            });
            await tunnel.update({ tunnelRemoteAccessEnabled: false });
            expect(tunnel.settings().tunnelHostname).toBeNull();
            expect(requests).toEqual([
                'POST /tunnel/enable',
                'GET /tunnel/routes',
                'DELETE /tunnel/disable',
            ]);
        }
    );
    it('allows tunnel access when HTTPS is enabled without strict mode', async () => {
        config.set('store.emhttp.nginx.sslMode', 'yes');
        await tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true });
        expect(await tunnel.processEnvironment()).toMatchObject({
            TARGET_ADDR: '127.0.0.1:443',
            CERT_ENABLED: 'true',
        });
    });
    it('rejects tunnel access when HTTPS is disabled', async () => {
        config.set('store.emhttp.nginx.sslEnabled', false);
        await expect(
            tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true })
        ).rejects.toThrow('Remote access requires HTTPS');
    });
    it('permits Go to renew a missing certificate after restart but requires a valid cert for initial tunnel opt-in', async () => {
        await rm(join(directory, 'bundle.pem'));
        await expect(
            tunnel.update({ certificateManagementEnabled: true, tunnelRemoteAccessEnabled: true })
        ).rejects.toThrow();
        await setFeatures({
            certificateManagementEnabled: true,
            tunnelRemoteAccessEnabled: true,
            tunnelHostname: hostname,
        });
        expect(await tunnel.processEnvironment()).toMatchObject({
            CERT_ENABLED: 'true',
            TARGET_ADDR: '127.0.0.1:443',
        });
    });
    it('refuses certificate ownership until the legacy writer patch is installed', async () => {
        await setFeatures({ certificateManagementEnabled: true });
        await writeFile(join(directory, 'ProvisionCert.php'), 'legacy writer');
        await expect(tunnel.start()).rejects.toThrow();
        expect(tunnel.status().presence).toBe('disconnected');
    });
    it('stops on sign-out, clears shared state, and retains explicit preferences', async () => {
        await setFeatures({ serverDataReportingEnabled: true });
        await tunnel.start();
        await tunnel.signOut();
        expect(tunnel.settings()).toMatchObject({
            apikey: '',
            username: '',
            serverDataReportingEnabled: true,
        });
        expect(await tunnel.processEnvironment()).toBeNull();
        expect(await readFile(tunnel.statePath, 'utf8')).not.toContain('Tower');
        expect(tunnel.status().presence).toBe('disconnected');
    });
    it('reconnects after a shared connector handoff', async () => {
        const starts = join(directory, 'starts');
        await writeFile(
            join(directory, 'connector'),
            `#!${process.execPath}
const fs = require('node:fs');
const path = ${JSON.stringify(starts)};
const count = fs.existsSync(path) ? Number(fs.readFileSync(path, 'utf8')) + 1 : 1;
fs.writeFileSync(path, String(count));
if (count === 1) process.exit(1);
console.log(JSON.stringify({event:'presence_connected'}));
setInterval(() => {}, 1000);
`,
            { mode: 0o755 }
        );
        await setFeatures({ serverDataReportingEnabled: true });
        await tunnel.start();
        await vi.waitFor(() => expect(tunnel.status().reason).toBe('connector_exited'));
        await vi.waitFor(() => expect(tunnel.status().presence).toBe('connected'), { timeout: 3000 });
        expect(await readFile(starts, 'utf8')).toBe('2');
    });
    it('rereads shared feature settings before a handoff retry', async () => {
        const starts = join(directory, 'starts');
        await writeFile(
            join(directory, 'connector'),
            `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(starts)}, 'start\\n');\nprocess.exit(1);\n`,
            { mode: 0o755 }
        );
        await setFeatures({ serverDataReportingEnabled: true });
        await tunnel.start();
        await vi.waitFor(() => expect(tunnel.status().reason).toBe('connector_exited'));
        await writeFile(
            persister.configPath(),
            JSON.stringify({ ...tunnel.settings(), serverDataReportingEnabled: false })
        );
        await vi.waitFor(() => expect(tunnel.settings().serverDataReportingEnabled).toBe(false), {
            timeout: 3000,
        });
        expect(await readFile(starts, 'utf8')).toBe('start\n');
        expect(tunnel.status().presence).toBe('disconnected');
    });
    it.each(['signOut', 'onModuleDestroy'] as const)('cancels a pending retry on %s', async (action) => {
        const starts = join(directory, 'starts');
        await writeFile(
            join(directory, 'connector'),
            `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(starts)}, 'start\\n');\nprocess.exit(1);\n`,
            { mode: 0o755 }
        );
        await setFeatures({ serverDataReportingEnabled: true });
        await tunnel.start();
        await vi.waitFor(() => expect(tunnel.status().reason).toBe('connector_exited'));
        await tunnel[action]();
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(await readFile(starts, 'utf8')).toBe('start\n');
    });
    it('does not restart the native connector after a durable refusal', async () => {
        const starts = join(directory, 'starts');
        await writeFile(
            join(directory, 'connector'),
            `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(starts)}, 'start\\n');\nconsole.log(JSON.stringify({event:'connected'}));\nprocess.exit(2);\n`,
            { mode: 0o755 }
        );
        await setFeatures({ serverDataReportingEnabled: true });
        await tunnel.start();
        await vi.waitFor(() => expect(tunnel.status().reason).toBe('connector_exited'));
        expect(tunnel.status().presence).toBe('disconnected');
        expect(tunnel.status().tunnel).not.toBe('connected');
        expect(new CloudService(tunnel).checkConnector().status).not.toBe('CONNECTED');
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(await readFile(starts, 'utf8')).toBe('start\n');
    });
});
