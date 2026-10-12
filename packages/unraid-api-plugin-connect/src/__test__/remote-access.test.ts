import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';

import { URL_TYPE } from '@unraid/shared/network.model.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ConfigType,
    DynamicRemoteAccessType,
    emptyMyServersConfig,
    makeDisabledDynamicRemoteAccessState,
} from '../config/connect.config.js';
import { ONE_MINUTE_MS } from '../helper/generic-consts.js';
import { EVENTS } from '../helper/nest-tokens.js';
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
    const reloadNetworkStack = vi.fn().mockResolvedValue(undefined);
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
        reloadNetworkStack.mockResolvedValue(undefined);
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
        const dependencies = await Test.createTestingModule({
            providers: [
                { provide: NetworkService, useValue: { reloadNetworkStack } },
                { provide: UpnpService, useValue: { createOrRenewUpnpLease, disableUpnp } },
                { provide: UserSettingsService, useValue: { register: vi.fn() } },
            ],
        }).compile();
        eventEmitter = new EventEmitter2();
        const networkService = dependencies.get(NetworkService);
        const wanAccess = new WanAccessEventHandler(configService, networkService);
        eventEmitter.on(EVENTS.ENABLE_WAN_ACCESS, () => wanAccess.enableWanAccess(), { async: true });
        eventEmitter.on(EVENTS.DISABLE_WAN_ACCESS, () => wanAccess.disableWanAccess(), { async: true });
        const urlResolver = new UrlResolverService(validatedConfigService);
        vi.spyOn(urlResolver, 'getRemoteAccessUrl').mockReturnValue(null);
        remoteAccess = new DynamicRemoteAccessService(
            validatedConfigService,
            new StaticRemoteAccessService(configService, eventEmitter, urlResolver),
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
        await dependencies.close();
    });

    afterEach(() => {
        eventEmitter.removeAllListeners();
        vi.restoreAllMocks();
    });

    async function startStatic() {
        await remoteAccess.enableDynamicRemoteAccess(staticRequest);
        await flushEvents();
        expect(configService.get('connect.config.wanaccess')).toBe(true);
    }

    it('does not reload the network stack for repeated active static requests', async () => {
        await startStatic();
        expect(reloadNetworkStack).toHaveBeenCalledTimes(1);
        remoteAccess.keepAlive();
        const lastPing = remoteAccess.getState().lastPing;

        for (let i = 0; i < 3; i++) {
            await remoteAccess.enableDynamicRemoteAccess(staticRequest);
            await flushEvents();
        }

        expect(reloadNetworkStack).toHaveBeenCalledTimes(1);
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
        expect(reloadNetworkStack).toHaveBeenCalledTimes(1);
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
        expect(reloadNetworkStack).toHaveBeenCalledTimes(2);
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
        expect(reloadNetworkStack).toHaveBeenCalledTimes(3);
    });

    it('still disables active static access', async () => {
        await startStatic();

        await remoteAccess.stopRemoteAccess();
        await flushEvents();

        expect(configService.get('connect.config.wanaccess')).toBe(false);
        expect(remoteAccess.getState()).toEqual(makeDisabledDynamicRemoteAccessState());
        expect(reloadNetworkStack).toHaveBeenCalledTimes(2);
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
        expect(reloadNetworkStack).toHaveBeenCalledTimes(3);
    });

    it('still disables remote access through settings', async () => {
        await startStatic();

        await settings.syncSettings({ accessType: WAN_ACCESS_TYPE.DISABLED });
        await flushEvents();

        expect(configService.get('connect.config.wanport')).toBeNull();
        expect(configService.get('connect.config.wanaccess')).toBe(false);
        expect(remoteAccess.getState().runningType).toBe(DynamicRemoteAccessType.DISABLED);
        expect(reloadNetworkStack).toHaveBeenCalledTimes(2);
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
        expect(reloadNetworkStack).toHaveBeenCalledTimes(7);
    });
});
