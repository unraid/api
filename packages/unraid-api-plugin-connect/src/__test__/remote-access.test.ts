import { ConfigService } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { URL_TYPE } from '@unraid/shared/network.model.js';
import { NginxService } from '@unraid/shared/services/nginx.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { NGINX_SERVICE_TOKEN } from '@unraid/shared/tokens.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ConfigType,
    DynamicRemoteAccessType,
    emptyMyServersConfig,
    makeDisabledDynamicRemoteAccessState,
} from '../config/connect.config.js';
import { ConnectConfigService } from '../config/connect.config.service.js';
import { ONE_MINUTE_MS } from '../helper/generic-consts.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { DnsService } from '../network/dns.service.js';
import { NetworkService } from '../network/network.service.js';
import { UpnpService } from '../network/upnp.service.js';
import { UrlResolverService } from '../network/url-resolver.service.js';
import { WanAccessEventHandler } from '../network/wan-access.events.js';
import { DynamicRemoteAccessService } from '../remote-access/dynamic-remote-access.service.js';
import { StaticRemoteAccessService } from '../remote-access/static-remote-access.service.js';
import { UpnpRemoteAccessService } from '../remote-access/upnp-remote-access.service.js';
import { ConnectSettingsService } from '../unraid-connect/connect-settings.service.js';
import { WAN_ACCESS_TYPE, WAN_FORWARD_TYPE } from '../unraid-connect/connect.model.js';

describe('remote access transitions', () => {
    let configService: ConfigService<ConfigType>;
    let remoteAccess: DynamicRemoteAccessService;
    let settings: ConnectSettingsService;
    let eventEmitter: EventEmitter2;
    let dependencies: TestingModule;
    const reloadNginx = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    const updateDns = vi.fn().mockResolvedValue(true);
    const createOrRenewUpnpLease = vi.fn().mockResolvedValue({ publicPort: 443 });
    const disableUpnp = vi.fn().mockResolvedValue(undefined);
    const allowedUrl = {
        ipv4: 'https://viewer.example.net',
        ipv6: null,
        type: URL_TYPE.WAN,
        name: 'Connect Web UI Access URL',
    };
    const staticRequest = { type: DynamicRemoteAccessType.STATIC, allowedUrl };
    const flushEvents = () => new Promise<void>((resolve) => setImmediate(resolve));

    beforeEach(async () => {
        vi.clearAllMocks();
        reloadNginx.mockResolvedValue(true);
        updateDns.mockResolvedValue(true);
        createOrRenewUpnpLease.mockResolvedValue({ publicPort: 443 });
        disableUpnp.mockResolvedValue(undefined);
        const configuration = {
            connect: {
                config: emptyMyServersConfig(),
                dynamicRemoteAccess: makeDisabledDynamicRemoteAccessState(),
            },
            store: { emhttp: { nginx: { sslEnabled: true, sslMode: 'yes', httpsPort: 443 } } },
        };
        configService = new ConfigService<ConfigType>(configuration);
        const validatedConfigService = new ConfigService<ConfigType, true>(configuration);
        const urlResolver = new UrlResolverService(validatedConfigService);
        vi.spyOn(urlResolver, 'getRemoteAccessUrl').mockReturnValue(null);
        dependencies = await Test.createTestingModule({
            imports: [EventEmitterModule.forRoot()],
            providers: [
                { provide: NGINX_SERVICE_TOKEN, useValue: { reload: reloadNginx } },
                { provide: DnsService, useValue: { update: updateDns } },
                {
                    provide: NetworkService,
                    useFactory: (nginx: NginxService, dns: DnsService) =>
                        new NetworkService(
                            nginx,
                            dns,
                            urlResolver,
                            new ConnectConfigService(configService)
                        ),
                    inject: [NGINX_SERVICE_TOKEN, DnsService],
                },
                {
                    provide: WanAccessEventHandler,
                    useFactory: (network: NetworkService) =>
                        new WanAccessEventHandler(configService, network),
                    inject: [NetworkService],
                },
                { provide: UpnpService, useValue: { createOrRenewUpnpLease, disableUpnp } },
                { provide: UserSettingsService, useValue: { register: vi.fn() } },
            ],
        }).compile();
        await dependencies.init();
        eventEmitter = dependencies.get(EventEmitter2);
        const networkService = dependencies.get(NetworkService);
        const staticAccess = new StaticRemoteAccessService(configService, eventEmitter, urlResolver);
        remoteAccess = new DynamicRemoteAccessService(
            validatedConfigService,
            staticAccess,
            new UpnpRemoteAccessService(
                dependencies.get(UpnpService),
                configService,
                urlResolver,
                eventEmitter
            )
        );
        settings = new ConnectSettingsService(
            configService,
            remoteAccess,
            eventEmitter,
            dependencies.get(UserSettingsService),
            networkService
        );
    });

    afterEach(async () => {
        await flushEvents();
        await dependencies.close();
        vi.restoreAllMocks();
    });

    async function startStatic() {
        await remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await flushEvents();
        expect(configService.get('connect.config.wanaccess')).toBe(true);
    }

    it('retries a failed nginx reload before reusing static access', async () => {
        reloadNginx.mockResolvedValueOnce(false);

        await remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await flushEvents();

        expect(configService.get('connect.config.wanaccess')).toBe(true);
        expect(remoteAccess.getState().error).toBeTruthy();
        expect(reloadNginx).toHaveBeenCalledTimes(1);
        expect(updateDns).toHaveBeenCalledTimes(1);

        await startStatic();
        expect(remoteAccess.getState().error).toBeNull();
        expect(reloadNginx).toHaveBeenCalledTimes(3);

        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(3);
    });

    it('does not complete a static start before the nginx reload finishes', async () => {
        const reload = Promise.withResolvers<boolean>();
        const reloadStarted = Promise.withResolvers<void>();
        reloadNginx.mockImplementationOnce(() => {
            reloadStarted.resolve();
            return reload.promise;
        });
        let completed = false;
        const start = remoteAccess.enableDynamicRemoteAccess(staticRequest).then(() => {
            completed = true;
        });
        await reloadStarted.promise;

        expect(reloadNginx).toHaveBeenCalledTimes(1);
        expect(completed).toBe(false);

        reload.resolve(true);
        await start;
        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(1);
    });

    it('requires an acknowledgement from the WAN handler', async () => {
        eventEmitter.removeAllListeners(EVENTS.ENABLE_WAN_ACCESS);

        await remoteAccess.enableDynamicRemoteAccess(staticRequest);

        expect(remoteAccess.getState().error).toBeTruthy();
        expect(reloadNginx).not.toHaveBeenCalled();
    });

    it('retries after the WAN handler suppresses a thrown reload error', async () => {
        reloadNginx.mockRejectedValueOnce(new Error('nginx reload failed'));

        await remoteAccess.enableDynamicRemoteAccess(staticRequest);

        expect(remoteAccess.getState().error).toBeTruthy();
        await startStatic();
        expect(remoteAccess.getState().error).toBeNull();
        expect(reloadNginx).toHaveBeenCalledTimes(3);
    });

    it('keeps a pending static start stopped after its reload completes', async () => {
        const reload = Promise.withResolvers<boolean>();
        const reloadStarted = Promise.withResolvers<void>();
        reloadNginx.mockImplementationOnce(() => {
            reloadStarted.resolve();
            return reload.promise;
        });
        const start = remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await reloadStarted.promise;

        await remoteAccess.stopRemoteAccess();
        expect(reloadNginx).toHaveBeenCalledTimes(2);
        expect(configService.get('connect.config.wanaccess')).toBe(false);
        reload.resolve(true);
        await start;

        expect(remoteAccess.getState()).toEqual(makeDisabledDynamicRemoteAccessState());
        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(3);
    });

    it('does not reuse a newer pending start when an older reload completes', async () => {
        const firstReload = Promise.withResolvers<boolean>();
        const nextReload = Promise.withResolvers<boolean>();
        const firstReloadStarted = Promise.withResolvers<void>();
        const nextReloadStarted = Promise.withResolvers<void>();
        reloadNginx.mockImplementationOnce(() => {
            firstReloadStarted.resolve();
            return firstReload.promise;
        });
        const firstStart = remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await firstReloadStarted.promise;
        reloadNginx.mockResolvedValueOnce(true).mockImplementationOnce(() => {
            nextReloadStarted.resolve();
            return nextReload.promise;
        });
        const nextStart = remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await nextReloadStarted.promise;
        expect(reloadNginx).toHaveBeenCalledTimes(3);

        firstReload.resolve(true);
        await firstStart;
        expect(remoteAccess.getState().allowedUrl).toBeNull();
        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(5);

        nextReload.resolve(true);
        await nextStart;
        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(5);
    });

    it('does not apply an older reload failure to a newer successful start', async () => {
        const firstReload = Promise.withResolvers<boolean>();
        const firstReloadStarted = Promise.withResolvers<void>();
        reloadNginx.mockImplementationOnce(() => {
            firstReloadStarted.resolve();
            return firstReload.promise;
        });
        const firstStart = remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await firstReloadStarted.promise;
        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(3);

        firstReload.resolve(false);
        await firstStart;

        expect(remoteAccess.getState().error).toBeNull();
        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(3);
    });

    it.each(['stop', 'start'])('preserves a newer %s during a pending teardown', async (action) => {
        await startStatic();
        const reload = Promise.withResolvers<boolean>();
        const reloadStarted = Promise.withResolvers<void>();
        reloadNginx.mockImplementationOnce(() => {
            reloadStarted.resolve();
            return reload.promise;
        });
        configService.set('connect.config.wanaccess', false);
        const restart = remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await reloadStarted.promise;

        const newerRequest = {
            ...staticRequest,
            allowedUrl: { ...allowedUrl, ipv4: 'https://newer-viewer.example.net' },
        };
        if (action === 'stop') {
            await remoteAccess.stopRemoteAccess();
        } else {
            await remoteAccess.enableDynamicRemoteAccess(newerRequest);
        }
        reload.resolve(true);
        await restart;

        if (action === 'stop') {
            expect(remoteAccess.getState()).toEqual(makeDisabledDynamicRemoteAccessState());
            expect(configService.get('connect.config.wanaccess')).toBe(false);
            expect(reloadNginx).toHaveBeenCalledTimes(3);
        } else {
            expect(remoteAccess.getState()).toMatchObject({
                runningType: DynamicRemoteAccessType.STATIC,
                allowedUrl: newerRequest.allowedUrl,
                error: null,
            });
            await remoteAccess.enableDynamicRemoteAccess(newerRequest);
            expect(reloadNginx).toHaveBeenCalledTimes(4);
        }
    });

    it('does not reload the network stack for repeated active static requests', async () => {
        await startStatic();
        expect(reloadNginx).toHaveBeenCalledTimes(1);
        remoteAccess.keepAlive();
        const lastPing = remoteAccess.getState().lastPing;

        for (let i = 0; i < 3; i++) {
            await remoteAccess.enableDynamicRemoteAccess(staticRequest);
            await flushEvents();
        }

        expect(reloadNginx).toHaveBeenCalledTimes(1);
        expect(remoteAccess.getState()).toMatchObject({
            runningType: DynamicRemoteAccessType.STATIC,
            allowedUrl,
            lastPing,
        });
        expect(configService.get('connect.config.wanaccess')).toBe(true);
        expect(createOrRenewUpnpLease).not.toHaveBeenCalled();
    });

    it('updates request metadata without restarting active static access', async () => {
        await startStatic();
        const updatedUrl = { ...allowedUrl, ipv4: 'https://another-viewer.example.net' };

        await remoteAccess.enableDynamicRemoteAccess({ ...staticRequest, allowedUrl: updatedUrl });
        await flushEvents();

        expect(remoteAccess.getState().allowedUrl).toEqual(updatedUrl);
        expect(reloadNginx).toHaveBeenCalledTimes(1);
    });

    it('preserves the timeout after a repeated static request', async () => {
        await startStatic();
        const now = Date.now();
        const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
        remoteAccess.keepAlive();
        await remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await flushEvents();
        clock.mockReturnValue(now + ONE_MINUTE_MS + 1);

        await remoteAccess.checkForTimeout();
        await flushEvents();

        expect(configService.get('connect.config.wanaccess')).toBe(false);
        expect(remoteAccess.getState()).toEqual(makeDisabledDynamicRemoteAccessState());
        expect(reloadNginx).toHaveBeenCalledTimes(2);
    });

    it.each(['disabled WAN access', 'an error'])('restarts static access after %s', async (reason) => {
        await startStatic();
        if (reason === 'disabled WAN access') {
            configService.set('connect.config.wanaccess', false);
        } else {
            configService.set('connect.dynamicRemoteAccess.error', 'Previous start failed');
        }

        await remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await flushEvents();

        expect(configService.get('connect.config.wanaccess')).toBe(true);
        expect(remoteAccess.getState().error).toBeNull();
        expect(reloadNginx).toHaveBeenCalledTimes(3);
    });

    it('still disables active static access', async () => {
        await startStatic();

        await remoteAccess.stopRemoteAccess();
        await flushEvents();

        expect(configService.get('connect.config.wanaccess')).toBe(false);
        expect(remoteAccess.getState()).toEqual(makeDisabledDynamicRemoteAccessState());
        expect(reloadNginx).toHaveBeenCalledTimes(2);
    });

    it('clears request metadata when the requested mode is disabled', async () => {
        await startStatic();

        await remoteAccess.enableDynamicRemoteAccess({
            type: DynamicRemoteAccessType.DISABLED,
            allowedUrl,
        });
        await flushEvents();

        expect(configService.get('connect.config.wanaccess')).toBe(false);
        expect(remoteAccess.getState()).toEqual(makeDisabledDynamicRemoteAccessState());
    });

    it('still applies static port changes through settings', async () => {
        await startStatic();

        await settings.syncSettings({
            accessType: WAN_ACCESS_TYPE.ALWAYS,
            forwardType: WAN_FORWARD_TYPE.STATIC,
            port: 8443,
        });
        await flushEvents();

        expect(configService.get('connect.config.wanport')).toBe(8443);
        expect(configService.get('connect.config.wanaccess')).toBe(true);
        expect(remoteAccess.getState().runningType).toBe(DynamicRemoteAccessType.STATIC);
        expect(reloadNginx).toHaveBeenCalledTimes(3);
    });

    it('still disables remote access through settings', async () => {
        await startStatic();

        await settings.syncSettings({ accessType: WAN_ACCESS_TYPE.DISABLED });
        await flushEvents();

        expect(configService.get('connect.config.wanport')).toBeNull();
        expect(configService.get('connect.config.wanaccess')).toBe(false);
        expect(remoteAccess.getState().runningType).toBe(DynamicRemoteAccessType.DISABLED);
        expect(reloadNginx).toHaveBeenCalledTimes(2);
    });

    it('retains UPnP lease renewal and transitions back to static access', async () => {
        await startStatic();
        const upnpRequest = { type: DynamicRemoteAccessType.UPNP, allowedUrl };

        await remoteAccess.enableDynamicRemoteAccess(upnpRequest);
        await flushEvents();
        expect(remoteAccess.getState().runningType).toBe(DynamicRemoteAccessType.UPNP);
        await remoteAccess.enableDynamicRemoteAccess(upnpRequest);
        await flushEvents();
        expect(createOrRenewUpnpLease).toHaveBeenCalledTimes(2);
        expect(disableUpnp).toHaveBeenCalledTimes(1);
        await remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await flushEvents();

        expect(disableUpnp).toHaveBeenCalledTimes(2);
        expect(configService.get('connect.config.wanaccess')).toBe(true);
        expect(remoteAccess.getState().runningType).toBe(DynamicRemoteAccessType.STATIC);
        expect(reloadNginx).toHaveBeenCalledTimes(7);
    });
});
