import type { OnModuleDestroy } from '@nestjs/common';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { createHmac, randomBytes, X509Certificate } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import { isIP } from 'node:net';
import { uptime } from 'node:os';
import { join } from 'node:path';

import type { CanonicalInternalClientService } from '@unraid/shared';
import type { NginxService } from '@unraid/shared/services/nginx.js';
import type { ResultPromise } from 'execa';
import { CANONICAL_INTERNAL_CLIENT_TOKEN, NGINX_SERVICE_TOKEN } from '@unraid/shared/tokens.js';
import { execa } from 'execa';
import { parse } from 'graphql';

import type { ConnectTunnelEntitlement } from './connect-tunnel-settings.model.js';
import type { WorkloadStates } from './overview.js';
import { ConnectConfigPersister } from '../config/config.persistence.js';
import { MyServersConfig } from '../config/connect.config.js';
import { writePrivateJson } from '../config/private-json-file.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { UrlResolverService } from '../network/url-resolver.service.js';
import {
    controlPlaneOrigin,
    ControlPlaneResponseError,
    requestControlPlane,
    webguiHostnames,
} from './control-plane.js';
import { ConnectGatewaySettingsInput, validateGatewayServices } from './gateway-settings.js';
import { object, overview, writeOverview } from './overview.js';

export type ConnectFeatures = Pick<
    MyServersConfig,
    'certificateManagementEnabled' | 'tunnelRemoteAccessEnabled' | 'serverDataReportingEnabled'
>;
const DOCKER_STATES_QUERY = parse('query ConnectDockerStates { docker { containers { state } } }');
const VM_STATES_QUERY = parse('query ConnectVmStates { vms { domains { state } } }');
const fields = [
    'certificateManagementEnabled',
    'tunnelRemoteAccessEnabled',
    'serverDataReportingEnabled',
] as const;
export const blankStatus = () => ({
    entitlement: null as ConnectTunnelEntitlement | null,
    entitlementState: 'unavailable',
    presence: 'disconnected',
    certificate: 'disabled',
    tunnel: 'idle',
    reason: '',
    presenceReason: '',
    tunnelReason: '',
    gateway: 'disabled',
    gatewayReason: '',
    routeState: 'disabled',
});

export function connectionStatus(state = blankStatus()) {
    const connected = state.presence === 'connected' || state.tunnel === 'connected';
    const connecting = state.presence === 'starting' || state.tunnel === 'tunnel_connecting';
    return {
        status: connected ? 'connected' : connecting ? 'connecting' : 'disconnected',
        error: connected ? null : state.presenceReason || state.tunnelReason || null,
    };
}

@Injectable()
export class ConnectTunnelService implements OnModuleDestroy {
    private readonly logger = new Logger(ConnectTunnelService.name);
    private child?: ResultPromise;
    private queue: Promise<unknown> = Promise.resolve();
    private timer?: NodeJS.Timeout;
    private destroyed = false;
    private readonly bootTime = new Date(Date.now() - uptime() * 1000).toISOString();
    private current = blankStatus();
    private commandReady = false;
    private aliasesApplied = false;
    private serviceRoutes = new Map<string, string>();
    private serviceRoutesSupported = false;
    private commandKey = randomBytes(32);
    private migration: { requestId: string | null; status: string; reason: string } = {
        requestId: null,
        status: 'idle',
        reason: '',
    };

    constructor(
        private readonly config: ConfigService,
        private readonly persistence: ConnectConfigPersister,
        private readonly urls: UrlResolverService,
        private readonly events: EventEmitter2,
        @Inject(NGINX_SERVICE_TOKEN) private readonly nginx: NginxService,
        @Optional()
        @Inject(CANONICAL_INTERNAL_CLIENT_TOKEN)
        private readonly internalClient?: CanonicalInternalClientService
    ) {}

    settings(): MyServersConfig {
        return this.persistence.getConfig();
    }
    status() {
        return { ...this.current };
    }
    async certificateMigration() {
        const child = this.child;
        const settings = this.settings();
        let domain: string | null = null;
        let fingerprint: string | null = null;
        let confirmationToken: string | null = null;
        let managed = false;
        try {
            const leaf = new X509Certificate(await readFile(this.bundlePath()));
            fingerprint = leaf.fingerprint256.replaceAll(':', '').toLowerCase();
            domain =
                leaf.subject.match(
                    /(?:^|\n)CN=(\*\.[a-z0-9-]+\.(?:preview\.)?myunraid\.net)(?:\n|$)/i
                )?.[1] ?? null;
            const marker = await readFile(`${this.bundlePath()}.csr-managed`, 'utf8').catch(
                (error: NodeJS.ErrnoException) => {
                    if (error.code === 'ENOENT') return '';
                    throw error;
                }
            );
            managed = marker.trim() === fingerprint;
            if (
                domain &&
                !managed &&
                child &&
                child === this.child &&
                this.commandReady &&
                settings.apikey &&
                settings.certificateManagementEnabled &&
                this.migration.status !== 'running'
            ) {
                confirmationToken = createHmac('sha256', this.commandKey)
                    .update(
                        JSON.stringify([
                            fingerprint,
                            settings.apikey,
                            ...fields.map((field) => settings[field]),
                            this.config.get<string>('CONNECT_CONTROL_PLANE_URL'),
                        ])
                    )
                    .digest('hex');
            }
        } catch {
            // A certificate or marker that cannot be read is never eligible for replacement.
        }
        return { ...this.migration, domain, fingerprint, managed, confirmationToken };
    }
    async migrateCertificate(confirmationToken: string) {
        await this.serial(async () => {
            const child = this.child;
            const certificate = await this.certificateMigration();
            if (
                !child?.stdin ||
                child !== this.child ||
                !this.commandReady ||
                !certificate.confirmationToken ||
                certificate.confirmationToken !== confirmationToken
            ) {
                throw new Error(
                    'Certificate migration confirmation is unavailable or stale. Review the current certificate again.'
                );
            }
            const requestId = randomBytes(16).toString('hex');
            this.migration = { requestId, status: 'running', reason: '' };
            this.publish();
            try {
                await new Promise<void>((resolve, reject) =>
                    child.stdin!.write(
                        JSON.stringify({
                            command: 'migrate_certificate',
                            request_id: requestId,
                            fingerprint: certificate.fingerprint,
                        }) + '\n',
                        (error) => (error ? reject(error) : resolve())
                    )
                );
            } catch {
                this.commandReady = false;
                this.migration = { requestId, status: 'interrupted', reason: 'command_write_failed' };
                this.publish();
                throw new Error(
                    'The connector command could not be confirmed. It will not be replayed.'
                );
            }
        });
    }
    private serial<T>(work: () => Promise<T>): Promise<T> {
        const result = this.queue.catch(() => undefined).then(work);
        this.queue = result;
        return result;
    }
    get statePath(): string {
        return (
            this.config.get<string>('CONNECT_STATE_PATH') ??
            join(this.config.getOrThrow<string>('PATHS_CONFIG_MODULES'), 'server-state-v1.json')
        );
    }
    private async workloadStates(): Promise<WorkloadStates> {
        const unavailable = { docker: null, virtualMachines: null };
        if (!this.internalClient) return unavailable;
        try {
            const client = await this.internalClient.getClient({ enableSubscriptions: false });
            const queryStates = async (
                query: ReturnType<typeof parse>,
                select: (data: Record<string, unknown>) => unknown
            ): Promise<string[] | null> => {
                let timer: NodeJS.Timeout | undefined;
                try {
                    const result = await Promise.race([
                        client.query<Record<string, unknown>>({ query, fetchPolicy: 'no-cache' }),
                        new Promise<null>((resolve) => {
                            timer = setTimeout(() => resolve(null), 3_000);
                        }),
                    ]);
                    if (!result) return null;
                    const values = select(result.data);
                    if (!Array.isArray(values)) return null;
                    const states = values.map((value) => object(value).state);
                    return states.every((state) => typeof state === 'string')
                        ? (states as string[])
                        : null;
                } catch {
                    return null;
                } finally {
                    if (timer) clearTimeout(timer);
                }
            };
            const [docker, virtualMachines] = await Promise.all([
                queryStates(DOCKER_STATES_QUERY, (data) => object(object(data).docker).containers),
                queryStates(VM_STATES_QUERY, (data) => object(object(data).vms).domains),
            ]);
            return { docker, virtualMachines };
        } catch {
            return unavailable;
        }
    }
    async preview() {
        return overview(
            this.config.get<unknown>('store.emhttp.var'),
            this.config.get<unknown>('store.emhttp.disks'),
            this.urls.getServerIps().urls,
            this.bootTime,
            await this.workloadStates()
        );
    }
    private async writeState() {
        const config = this.settings();
        return writeOverview(
            this.statePath,
            config.apikey && config.serverDataReportingEnabled
                ? await this.preview()
                : overview({}, [], [], null)
        );
    }
    private request(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body: object = {}) {
        return requestControlPlane(
            this.config.get<string>('CONNECT_CONTROL_PLANE_URL') ?? '',
            this.settings().apikey,
            path,
            method,
            body
        );
    }
    private async save(changes: Partial<MyServersConfig>): Promise<void> {
        await this.persistence.update(changes);
    }

    @OnEvent('app.ready', { async: true })
    async start(): Promise<void> {
        await this.serial(async () => {
            try {
                await this.reload();
            } finally {
                this.scheduleRefresh();
            }
        });
    }
    @OnEvent(EVENTS.LOGIN, { async: true })
    async onLogin(): Promise<void> {
        await this.start();
    }

    @OnEvent(EVENTS.LOGOUT, { async: true })
    async signOut(): Promise<void> {
        await this.serial(async () => {
            await this.stopChild();
            await this.save({
                apikey: '',
                localApiKey: '',
                username: '',
                avatar: '',
                email: null,
                regWizTime: '',
            });
            await this.writeState();
            await this.events.emitAsync(EVENTS.IDENTITY_CHANGED);
        });
    }

    @OnEvent('oidc.providers.persisted', { async: true })
    async onOidcProvidersPersisted(): Promise<void> {
        if (
            !this.settings().gatewayServices.some(
                (service) => service.enabled && service.auth === 'oidc'
            )
        )
            return;
        await this.serial(() => this.reload(false));
    }
    async signIn(
        apiKey: string,
        user: { preferred_username: string; email: string; avatar?: string }
    ): Promise<void> {
        await this.serial(async () => {
            if (!apiKey.trim() || !user.preferred_username.trim() || !user.email.trim())
                throw new Error('Missing account identity');
            await this.stopChild();
            const sameIdentity = this.settings().apikey === apiKey;
            await this.save({
                apikey: apiKey,
                username: user.preferred_username,
                email: user.email,
                avatar: user.avatar ?? '',
                ...(sameIdentity ? {} : { serverDataRemoteCleared: false }),
            });
            await this.reload();
            this.scheduleRefresh();
            await this.events.emitAsync(EVENTS.IDENTITY_CHANGED);
        });
    }

    async update(input: Partial<ConnectFeatures>): Promise<void> {
        await this.serial(async () => {
            const old = this.settings();
            for (const key of Object.keys(input)) {
                if (!fields.some((field) => field === key)) throw new Error('Unknown Connect setting');
            }
            for (const value of Object.values(input))
                if (typeof value !== 'boolean') throw new Error('Connect settings must be booleans');
            if (fields.every((field) => input[field] === undefined || input[field] === old[field]))
                return;
            if (!old.apikey) throw new Error('Sign in to Unraid Connect first');
            const desired = { ...old, ...input };
            if (!desired.certificateManagementEnabled && desired.tunnelRemoteAccessEnabled) {
                throw new Error('Turn off remote access before disabling certificate management');
            }
            if (desired.tunnelRemoteAccessEnabled && !old.tunnelRemoteAccessEnabled)
                await this.assertHttps();
            await this.stopChild();
            let entitlement: ConnectTunnelEntitlement | null = null;
            try {
                if (input.tunnelRemoteAccessEnabled === false && old.tunnelRemoteAccessEnabled) {
                    const body = object(await this.request('/tunnel/disable', 'DELETE'));
                    if (!Number.isInteger(body.removed) || Number(body.removed) < 0)
                        throw new Error('Invalid tunnel acknowledgement');
                    await this.save({
                        tunnelRemoteAccessEnabled: false,
                        tunnelHostname: null,
                        tunnelHostnames: [],
                    });
                    if (!(await this.nginx.reload())) throw new Error('Nginx reload failed');
                }
                if (input.certificateManagementEnabled !== undefined)
                    await this.save({
                        certificateManagementEnabled: input.certificateManagementEnabled,
                    });
                if (input.tunnelRemoteAccessEnabled === true && !old.tunnelRemoteAccessEnabled) {
                    await this.save({
                        tunnelRemoteAccessEnabled: true,
                        gatewayServicesPending:
                            old.gatewayServicesPending || old.gatewayServicesRevision > 0,
                        tunnelHostname: null,
                        tunnelHostnames: [],
                    });
                    try {
                        const body = object(await this.request('/tunnel/enable', 'POST'));
                        entitlement = parseEntitlement(body.entitlement);
                        const names = webguiHostnames(body.routes, body.hostname);
                        const certificate = new X509Certificate(await readFile(this.bundlePath()));
                        if (names.some((name) => !certificate.checkHost(name))) {
                            throw new Error('Tunnel hostname is not covered by the certificate');
                        }
                        await this.save({
                            tunnelHostname: String(body.hostname),
                            tunnelHostnames: names,
                        });
                        this.aliasesApplied = false;
                        if (!(await this.nginx.reload())) throw new Error('Nginx reload failed');
                        this.aliasesApplied = true;
                    } catch (error) {
                        await this.request('/tunnel/disable', 'DELETE').catch(() => undefined);
                        await this.save({
                            tunnelRemoteAccessEnabled: false,
                            tunnelHostname: null,
                            tunnelHostnames: [],
                        });
                        throw error;
                    }
                }
                if (input.serverDataReportingEnabled !== undefined) {
                    const enabled = input.serverDataReportingEnabled;
                    await this.save({
                        serverDataReportingEnabled: enabled,
                        serverDataRemoteCleared: false,
                    });
                    try {
                        await this.writeState();
                        if (enabled) {
                            const body = object(await this.request('/presence/state/enable', 'POST'));
                            if (body.enabled !== true) throw new Error('Sharing was not acknowledged');
                        } else await this.clearRemote();
                    } catch (error) {
                        if (enabled) {
                            await this.save({ serverDataReportingEnabled: false });
                            await this.writeState();
                            await this.clearRemote().catch(() => undefined);
                        }
                        throw error;
                    }
                }
            } finally {
                await this.reload();
                if (entitlement && this.settings().tunnelRemoteAccessEnabled) {
                    this.current.entitlement = entitlement;
                    this.current.entitlementState = 'current';
                    this.publish();
                }
                this.scheduleRefresh();
            }
        });
    }

    private delegatedCallbackOrigin(): string | null {
        const host = this.settings().tunnelHostname;
        return host && /^tun-[a-z0-9-]+\.[a-z0-9]+\.(?:preview\.)?myunraid\.net$/.test(host)
            ? `https://${host}`
            : null;
    }
    gatewaySettings() {
        const settings = this.settings();
        return {
            revision: settings.gatewayServicesRevision,
            callbackUrl: this.delegatedCallbackOrigin()
                ? `${this.delegatedCallbackOrigin()}/_connect/oidc/callback`
                : null,
            available:
                settings.gatewayServicesRevision > 0 ||
                (this.serviceRoutesSupported &&
                    this.config.get<string>('CONNECT_GATEWAY_ENABLED') === 'true'),
            pending: settings.gatewayServicesPending,
            services: settings.gatewayServices.map((service) => ({
                ...service,
                providerId: service.providerId ?? '',
                subjects: service.subjects ?? [],
                url:
                    service.enabled &&
                    settings.tunnelRemoteAccessEnabled &&
                    !settings.gatewayServicesPending &&
                    this.serviceRoutes.has(service.id)
                        ? `https://${this.serviceRoutes.get(service.id)}`
                        : null,
            })),
        };
    }
    async updateGatewayServices(input: ConnectGatewaySettingsInput): Promise<void> {
        await this.serial(async () => {
            const old = this.settings();
            if (!old.apikey) throw new Error('Sign in to Unraid Connect first');
            if (input.expectedRevision !== old.gatewayServicesRevision)
                throw new Error('Service settings changed. Reload before saving again.');
            const services = validateGatewayServices(input.services);
            if (
                this.config.get<string>('CONNECT_GATEWAY_ENABLED') !== 'true' &&
                old.gatewayServicesRevision === 0
            )
                throw new Error('The service gateway is not enabled on this server');
            if (
                old.gatewayServicesPending &&
                old.tunnelRemoteAccessEnabled &&
                JSON.stringify(services) !== JSON.stringify(old.gatewayServices)
            )
                throw new Error('Retry the pending service save before making another change');
            await this.stopChild();
            try {
                await this.save({
                    gatewayServices: services,
                    gatewayServicesRevision: old.gatewayServicesRevision + 1,
                    gatewayServicesPending: true,
                });
                await this.syncGatewayServices();
            } finally {
                await this.reload(false);
            }
        });
    }
    private async syncGatewayServices(): Promise<void> {
        const settings = this.settings();
        if (!settings.gatewayServicesPending || !settings.tunnelRemoteAccessEnabled || !settings.apikey)
            return;
        const serviceIds = settings.gatewayServices
            .filter((s) => s.enabled)
            .map((s) => s.id)
            .sort();
        const result = object(await this.request('/tunnel/services', 'PUT', { serviceIds }));
        if (result.version !== 1 || !Array.isArray(result.routes))
            throw new Error('Invalid service route response');
        const certificate = new X509Certificate(await readFile(this.bundlePath()));
        const hostnames = new Set<string>();
        for (const raw of result.routes) {
            const route = object(raw);
            if (
                route.enabled !== true ||
                typeof route.hostname !== 'string' ||
                !certificate.checkHost(route.hostname) ||
                hostnames.has(route.hostname)
            )
                throw new Error('Invalid service route hostname');
            hostnames.add(route.hostname);
            if (route.purpose !== 'webgui' && (route.id !== route.purpose || route.kind !== 'service'))
                throw new Error('Invalid service route identity');
        }
        const actual = result.routes
            .filter((r) => object(r).enabled === true && object(r).purpose !== 'webgui')
            .map((r) => object(r).purpose)
            .sort();
        if (JSON.stringify(actual) !== JSON.stringify(serviceIds))
            throw new Error('Service routes have not been confirmed');
        await this.save({ gatewayServicesPending: false });
    }

    private bundlePath() {
        return (
            this.config.get<string>('CONNECT_CERT_BUNDLE_PATH') ??
            '/boot/config/ssl/certs/certificate_bundle.pem'
        );
    }
    private async assertHttps(): Promise<void> {
        if (
            !this.config.get('store.emhttp.nginx.sslEnabled') ||
            this.config.get('store.emhttp.nginx.sslMode') !== 'auto'
        ) {
            throw new Error('Remote access requires strict HTTPS');
        }
        const cert = new X509Certificate(await readFile(this.bundlePath()));
        if (
            Date.parse(cert.validTo) <= Date.now() ||
            Date.parse(cert.validFrom) > Date.now() ||
            !/(?:DNS:|CN=)\*\.[a-z0-9-]+\.(?:preview\.)?myunraid\.net(?:,|\n|$)/i.test(
                `${cert.subjectAltName ?? ''}\n${cert.subject}`
            )
        ) {
            throw new Error('Remote access requires a valid myunraid.net certificate');
        }
    }
    async processEnvironment(): Promise<NodeJS.ProcessEnv | null> {
        const configDirectory = this.config.getOrThrow<string>('PATHS_CONFIG_MODULES');
        await Promise.all(
            ['connect-gateway-v2.json', 'connect-gateway-v3.json'].map((name) =>
                rm(join(configDirectory, name), { force: true })
            )
        );
        const settings = this.settings();
        const cert = settings.certificateManagementEnabled;
        const tunnel = settings.tunnelRemoteAccessEnabled;
        const sharing = settings.serverDataReportingEnabled;
        if (!settings.apikey || !(cert || tunnel || sharing)) return null;
        const certificateOnly = cert && !tunnel && !sharing;
        let target = '127.0.0.1:1';
        if (tunnel) {
            if (
                !this.config.get('store.emhttp.nginx.sslEnabled') ||
                this.config.get('store.emhttp.nginx.sslMode') !== 'auto'
            ) {
                throw new Error('Remote access requires strict HTTPS');
            }
            const port = this.config.get<number>('store.emhttp.nginx.httpsPort');
            if (!Number.isInteger(port) || !port || port < 1 || port > 65535)
                throw new Error('HTTPS port unavailable');
            const address = this.config.get<string>('store.emhttp.nginx.lanIp');
            if (!address || !isIP(address)) throw new Error('Local HTTPS address unavailable');
            target = `${isIP(address) === 6 ? `[${address}]` : address}:${port}`;
        }
        let gatewayPath: string | undefined;
        if (
            tunnel &&
            (this.config.get<string>('CONNECT_GATEWAY_ENABLED') === 'true' ||
                settings.gatewayServicesRevision > 0)
        ) {
            const entries = this.config.get<unknown>('store.emhttp.nginx.fqdnUrls');
            const lan = Array.isArray(entries)
                ? entries.find(
                      (entry: unknown) =>
                          object(entry).interface === 'LAN' && object(entry).isIpv6 === false
                  )
                : undefined;
            const hostname = object(lan).fqdn;
            if (
                typeof hostname !== 'string' ||
                !/^[a-z0-9.-]+\.(?:preview\.)?myunraid\.net$/.test(hostname)
            )
                throw new Error('Gateway requires the local nginx HTTPS hostname');
            const delegated = settings.gatewayServices.some((s) => s.enabled && s.auth === 'oidc');
            const callbackOrigin = this.delegatedCallbackOrigin();
            if (delegated && !callbackOrigin)
                throw new Error('Configured provider sign-in requires the parent tunnel route');
            gatewayPath = join(configDirectory, 'connect-gateway-v1.json');
            await writePrivateJson(
                gatewayPath,
                JSON.stringify({
                    version: 1,
                    issuer: new URL(
                        controlPlaneOrigin(this.config.get<string>('CONNECT_CONTROL_PLANE_URL'))
                    ).hostname.startsWith('preview.')
                        ? 'https://preview.account.unraid.net'
                        : 'https://account.unraid.net',
                    clientId: 'CONNECT_SERVER_SSO',
                    ...(delegated && {
                        oidcCallbackOrigin: callbackOrigin,
                    }),
                    services: [
                        {
                            purpose: 'webgui',
                            upstream: `https://${target}`,
                            tlsServerName: hostname,
                            auth: 'upstream',
                        },
                        ...settings.gatewayServices
                            .filter((service) => service.enabled)
                            .map((service) => ({
                                purpose: service.id,
                                upstream: service.upstream,
                                ...(service.tlsServerName && { tlsServerName: service.tlsServerName }),
                                auth: service.auth ?? 'account',
                                ...(service.auth === 'oidc' && {
                                    providerId: service.providerId,
                                    subjects: service.subjects ?? [],
                                }),
                            })),
                    ],
                })
            );
        }
        return {
            PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            CONTROL_PLANE_URL: controlPlaneOrigin(this.config.get<string>('CONNECT_CONTROL_PLANE_URL')),
            API_KEY: settings.apikey,
            CERT_ONLY: String(certificateOnly),
            CERT_ENABLED: String(cert),
            BUNDLE_PATH: this.bundlePath(),
            RELOAD_CMD: '/etc/rc.d/rc.nginx reload',
            IDLE_TIMEOUT: '90s',
            ...(certificateOnly ? {} : { TARGET_ADDR: target }),
            ...(gatewayPath ? { GATEWAY_CONFIG: gatewayPath } : {}),
            ...(gatewayPath
                ? {
                      OIDC_CONFIG_PATH:
                          process.env.PATHS_OIDC_JSON ?? join(configDirectory, 'oidc.json'),
                  }
                : {}),
            ...(sharing ? { STATE_FILE: this.statePath } : {}),
            PRESENCE_EVENT_PUBLIC_KEYS:
                this.config.get<string>('CONNECT_PRESENCE_EVENT_PUBLIC_KEYS') ?? '',
        };
    }
    private async refreshAliases(): Promise<void> {
        const settings = this.settings();
        if (!settings.apikey || !settings.tunnelRemoteAccessEnabled) return;
        try {
            const body = object(await this.request('/tunnel/routes', 'GET'));
            this.serviceRoutesSupported = body.serviceRoutesSupported === true;
            if (body.version !== 1 || !Array.isArray(body.routes))
                throw new Error('Invalid route snapshot');
            const primary = body.routes.find((route: unknown) => {
                const entry = object(route);
                return entry.purpose === 'webgui' && entry.enabled === true && entry.kind === 'dynamic';
            });
            const names = webguiHostnames(body.routes, object(primary).hostname);
            const certificate = new X509Certificate(await readFile(this.bundlePath()));
            if (names.some((name) => !certificate.checkHost(name)))
                throw new Error('Route certificate mismatch');
            if (
                !this.aliasesApplied ||
                settings.tunnelHostname !== object(primary).hostname ||
                JSON.stringify(settings.tunnelHostnames) !== JSON.stringify(names)
            ) {
                this.aliasesApplied = false;
                await this.save({
                    tunnelHostname: String(object(primary).hostname),
                    tunnelHostnames: names,
                });
                if (!(await this.nginx.reload())) throw new Error('Nginx reload failed');
            }
            this.serviceRoutes.clear();
            for (const raw of body.routes) {
                const entry = object(raw);
                if (
                    entry.enabled === true &&
                    typeof entry.purpose === 'string' &&
                    /^app-[a-f0-9]{16}$/.test(entry.purpose) &&
                    typeof entry.hostname === 'string' &&
                    certificate.checkHost(entry.hostname)
                )
                    this.serviceRoutes.set(entry.purpose, entry.hostname);
            }
            this.aliasesApplied = true;
            this.current.routeState = 'ready';
        } catch (error) {
            if (error instanceof ControlPlaneResponseError && [401, 403, 409].includes(error.status)) {
                this.aliasesApplied = false;
                await this.save({ tunnelHostname: null, tunnelHostnames: [] });
                if (!(await this.nginx.reload())) throw new Error('Nginx reload failed');
            }
            // A failed alias refresh does not change local certificate ownership or
            // replace Go's independently expiring viewer authorization snapshot.
            this.serviceRoutes.clear();
            this.current.routeState = 'unavailable';
            this.logger.warn('Connect route aliases could not be refreshed');
        }
        this.publish();
    }
    private async reload(syncServices = true): Promise<void> {
        await this.stopChild();
        if (this.destroyed) return;
        if (syncServices)
            await this.syncGatewayServices().catch(() =>
                this.logger.warn('Connect service routes await confirmation')
            );
        await this.writeState();
        await this.refreshAliases();
        const env = await this.processEnvironment();
        if (!env) return;
        if (env.CERT_ENABLED === 'true') {
            const provisioner = await readFile(
                this.config.get<string>('CONNECT_CERT_PROVISIONER_PATH') ??
                    '/usr/local/emhttp/plugins/dynamix/include/ProvisionCert.php',
                'utf8'
            );
            if (
                !provisioner.includes(
                    'Certificate provisioning and renewal are owned by the installed Connect plugin.'
                )
            ) {
                throw new Error('The Connect certificate migration patch must be installed first');
            }
        }
        const executable =
            this.config.get<string>('CONNECT_CONNECTOR_PATH') ??
            '/usr/local/libexec/unraid-connect/presence-connector';
        const child = execa(executable, [], {
            env,
            extendEnv: false,
            reject: false,
            buffer: false,
            stdin: 'pipe',
            stderr: 'ignore',
            forceKillAfterDelay: 2000,
        });
        this.child = child;
        this.commandKey = randomBytes(32);
        child.stdin?.on('error', () => {
            if (this.child === child) this.commandReady = false;
        });
        this.current.presence = env.CERT_ONLY === 'true' ? 'disconnected' : 'starting';
        this.current.certificate = env.CERT_ENABLED === 'true' ? 'checking' : 'disabled';
        this.publish();
        let buffer = '';
        let discard = false;
        child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
            if (this.child !== child) return;
            for (const fragment of chunk.split(/(?<=\n)/)) {
                if (!discard) buffer += fragment;
                if (buffer.length > 65_536) {
                    buffer = '';
                    discard = true;
                }
                if (fragment.endsWith('\n')) {
                    if (!discard) this.acceptStatus(buffer);
                    buffer = '';
                    discard = false;
                }
            }
        });
        void child.then(() => {
            if (this.child === child) {
                this.child = undefined;
                this.current.presence = 'disconnected';
                this.current.tunnel = 'disconnected';
                this.current.presenceReason = 'connector_exited';
                this.current.tunnelReason = '';
                this.current.reason = 'connector_exited';
                this.current.entitlementState = 'unavailable';
                this.commandReady = false;
                if (this.migration.status === 'running') {
                    this.migration.status = 'interrupted';
                    this.migration.reason = 'connector_exited';
                    void this.nginx
                        .reload()
                        .catch(() => this.logger.warn('Connect HTTPS refresh failed'));
                }
                this.publish();
            }
        });
    }
    private async stopChild(): Promise<void> {
        const child = this.child;
        this.child = undefined;
        this.commandReady = false;
        const interrupted = this.migration.status === 'running';
        if (interrupted)
            this.migration = { ...this.migration, status: 'interrupted', reason: 'connector_stopped' };
        if (child) {
            child.kill('SIGTERM');
            await child;
        }
        if (interrupted && !(await this.nginx.reload().catch(() => false))) {
            this.migration.reason = 'https_reload_failed';
        }
        this.current = blankStatus();
        this.publish();
    }
    private acceptStatus(line: string): void {
        let payload: Record<string, unknown>;
        try {
            payload = object(JSON.parse(line));
        } catch {
            return;
        }
        const event = payload.event;
        if (event === 'gateway_status') {
            if (!['ready', 'stale', 'unavailable'].includes(String(payload.state))) return;
            this.current.gateway = String(payload.state);
            this.current.gatewayReason =
                typeof payload.reason === 'string' && /^[a-z_]{0,80}$/.test(payload.reason)
                    ? payload.reason
                    : 'gateway_unavailable';
            this.publish();
            return;
        }
        if (event === 'entitlement_updated') {
            let snapshot: unknown;
            try {
                snapshot =
                    typeof payload.entitlement === 'string' ? JSON.parse(payload.entitlement) : null;
            } catch {
                snapshot = null;
            }
            const entitlement = parseEntitlement(snapshot);
            if (!entitlement) {
                this.current.entitlementState = 'unavailable';
            } else {
                this.current.entitlement = entitlement;
                this.current.entitlementState = 'current';
                if (
                    !entitlement.reason &&
                    ['quota_exhausted', 'entitlement_inactive'].includes(this.current.tunnelReason)
                ) {
                    this.current.tunnel = 'tunnel_idle';
                    this.current.tunnelReason = '';
                }
            }
            this.publish();
            return;
        }
        if (event === 'entitlement_unavailable') {
            this.current.entitlementState = 'unavailable';
            this.publish();
            return;
        }
        if (event === 'cert_commands_ready') {
            this.commandReady = true;
            return;
        }
        if (event === 'cert_commands_closed') {
            this.commandReady = false;
            return;
        }
        if (event === 'cert_migration_result' || event === 'cert_command_rejected') {
            if (payload.request_id !== this.migration.requestId || this.migration.status !== 'running')
                return;
            if (event === 'cert_command_rejected' && payload.reason === 'duplicate_request') return;
            const reason =
                typeof payload.reason === 'string' && /^[a-z_]{1,80}$/.test(payload.reason)
                    ? payload.reason
                    : 'unknown';
            const outcome = event === 'cert_command_rejected' ? 'failed' : payload.outcome;
            if (outcome !== 'failed' && outcome !== 'installed' && outcome !== 'installed_unconfirmed')
                return;
            this.migration = { ...this.migration, status: outcome, reason };
            if (outcome !== 'failed') {
                // Go can replace the bundle before marker/cleanup fails. Refresh HTTPS for both outcomes.
                this.commandReady = false;
                const migration = this.migration;
                void this.nginx
                    .reload()
                    .then((reloaded) => {
                        if (this.migration === migration && !reloaded) {
                            this.migration = {
                                ...migration,
                                status: 'installed_unconfirmed',
                                reason: 'https_reload_failed',
                            };
                            this.publish();
                        }
                    })
                    .catch(() => {
                        if (this.migration === migration) {
                            this.migration = {
                                ...migration,
                                status: 'installed_unconfirmed',
                                reason: 'https_reload_failed',
                            };
                            this.publish();
                        }
                    });
            }
            this.publish();
            return;
        }
        const reason =
            typeof payload.reason === 'string' && /^[a-z_]{1,80}$/.test(payload.reason)
                ? payload.reason
                : '';
        if (event === 'presence_connected' || event === 'presence_disconnected') {
            this.current.presence = event.slice(9);
            if (event === 'presence_disconnected') this.current.entitlementState = 'unavailable';
            this.current.presenceReason = event === 'presence_connected' ? '' : reason || event;
        } else if (
            typeof event === 'string' &&
            /^cert_(checking|provisioning|retrying|refused|valid|installed)$/.test(event)
        )
            this.current.certificate = event.slice(5);
        else if (
            typeof event === 'string' &&
            /^(connected|disconnected|tunnel_connecting|tunnel_retrying|tunnel_blocked|tunnel_down|tunnel_idle)$/.test(
                event
            )
        ) {
            this.current.tunnel = event;
            this.current.tunnelReason =
                event === 'tunnel_down'
                    ? this.current.tunnelReason
                    : /^(tunnel_retrying|tunnel_blocked|disconnected)$/.test(event)
                      ? reason || event
                      : '';
        } else if (event === 'refused') {
            this.current.tunnel = 'refused';
            this.current.tunnelReason = reason || 'refused';
        } else return;
        this.current.reason = reason;
        this.publish();
    }
    private publish() {
        this.config.set('connect.tunnel', this.status());
        this.events.emit('connect.tunnel.changed');
    }
    private async clearRemote(): Promise<void> {
        const settings = this.settings();
        if (!settings.apikey || settings.serverDataReportingEnabled || settings.serverDataRemoteCleared)
            return;
        const body = object(await this.request('/presence/state', 'DELETE'));
        if (typeof body.removed !== 'boolean') throw new Error('Overview cleanup was not acknowledged');
        await this.save({ serverDataRemoteCleared: true });
    }
    private scheduleRefresh(): void {
        clearTimeout(this.timer);
        if (this.destroyed) return;
        this.timer = setTimeout(() => {
            void this.serial(async () => {
                if (!this.destroyed) {
                    await this.writeState();
                    await this.refreshAliases();
                    await this.clearRemote();
                }
            })
                .catch(() => this.logger.warn('Connect overview refresh or cleanup failed'))
                .finally(() => this.scheduleRefresh());
        }, 300_000);
        this.timer.unref();
    }
    async onModuleDestroy(): Promise<void> {
        this.destroyed = true;
        clearTimeout(this.timer);
        await this.serial(async () => {
            await this.stopChild();
            await writeOverview(this.statePath, overview({}, [], [], null));
        });
    }
}

// Project only the versioned, bounded usage contract. Never display arbitrary
// connector diagnostics or infer an unlimited allowance from missing fields.
export function parseEntitlement(value: unknown): ConnectTunnelEntitlement | null {
    const data = object(value);
    const count = (key: string) =>
        typeof data[key] === 'number' && Number.isSafeInteger(data[key]) && Number(data[key]) >= 0;
    if (
        data.schema_version !== 1 ||
        !['available', 'blocked', 'unknown'].includes(String(data.access_state)) ||
        !['active', 'trial', 'past_due', 'canceled', 'expired', 'inactive', 'unknown'].includes(
            String(data.status)
        ) ||
        !['limited', 'unlimited'].includes(String(data.rate_mode)) ||
        !['rate_bytes_per_second', 'bytes_used', 'quota_bytes', 'period_start', 'period_end'].every(
            count
        ) ||
        !(data.usage_updated_at === null || count('usage_updated_at')) ||
        !(data.bytes_remaining === null || count('bytes_remaining'))
    )
        return null;
    const quota = Number(data.quota_bytes);
    const used = Number(data.bytes_used);
    const reason = data.reason;
    if (
        (reason !== null && reason !== 'quota_exhausted' && reason !== 'entitlement_inactive') ||
        (data.access_state === 'blocked') !== (reason !== null) ||
        (data.rate_mode === 'limited') !== Number(data.rate_bytes_per_second) > 0 ||
        Number(data.period_end) <= Number(data.period_start) ||
        data.bytes_remaining !== (quota === 0 ? null : Math.max(0, quota - used))
    )
        return null;
    return {
        accessState: String(data.access_state),
        reason,
        status: String(data.status),
        rateMode: String(data.rate_mode),
        rateBytesPerSecond: Number(data.rate_bytes_per_second),
        bytesUsed: used,
        quotaBytes: quota,
        bytesRemaining: data.bytes_remaining as number | null,
        periodStart: Number(data.period_start),
        periodEnd: Number(data.period_end),
        updatedAt: data.usage_updated_at as number | null,
    };
}
