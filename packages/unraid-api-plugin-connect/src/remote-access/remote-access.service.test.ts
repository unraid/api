import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { emptyMyServersConfig } from '../config/connect.config.js';
import { UpnpService } from '../network/upnp.service.js';
import { WAN_ACCESS_TYPE, WAN_FORWARD_TYPE } from '../unraid-connect/connect.model.js';
import { RemoteAccessService } from './remote-access.service.js';

const always = WAN_ACCESS_TYPE.ALWAYS;
const off = WAN_ACCESS_TYPE.DISABLED;
const manual = WAN_FORWARD_TYPE.STATIC;
const automatic = WAN_FORWARD_TYPE.UPNP;

describe('direct remote access alongside the native tunnel', () => {
    let directory: string;
    let config: ConfigService;
    let persistence: ConnectConfigPersister;
    let upnp: UpnpService;
    let service: RemoteAccessService;
    let client: {
        createMapping: ReturnType<typeof vi.fn>;
        removeMapping: ReturnType<typeof vi.fn>;
        getMappings: ReturnType<typeof vi.fn>;
    };
    let network: { reloadNetworkStack: ReturnType<typeof vi.fn> };
    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'connect-direct-'));
        config = new ConfigService({
            PATHS_CONFIG_MODULES: directory,
            CONNECT_CERT_BUNDLE_PATH: join(directory, 'missing.pem'),
            connect: {
                config: {
                    ...emptyMyServersConfig(),
                    apikey: 'test-key',
                    username: 'user',
                    certificateManagementEnabled: true,
                    tunnelRemoteAccessEnabled: true,
                    serverDataReportingEnabled: true,
                },
            },
            store: {
                emhttp: {
                    nginx: {
                        sslEnabled: true,
                        httpsPort: 443,
                        certificateName: '*.example.myunraid.net',
                    },
                },
            },
        });
        persistence = new ConnectConfigPersister(config);
        client = {
            createMapping: vi.fn().mockResolvedValue(undefined),
            removeMapping: vi.fn().mockResolvedValue(undefined),
            getMappings: vi.fn().mockResolvedValue([]),
        };
        network = { reloadNetworkStack: vi.fn().mockResolvedValue(undefined) };
        upnp = new UpnpService(config, client, new SchedulerRegistry());
        service = new RemoteAccessService(config, persistence, upnp, network);
    });
    afterEach(async () => {
        if (upnp.enabled) await upnp.disableUpnp();
        await rm(directory, { recursive: true, force: true });
    });
    it('does not reload the network when a combined settings form submits unchanged direct settings', async () => {
        await service.update(service.settings());
        expect(network.reloadNetworkStack).not.toHaveBeenCalled();
        expect(client.createMapping).not.toHaveBeenCalled();
    });
    it('persists manual forwarding without changing tunnel, certificate, or sharing opt-ins', async () => {
        await service.update({ accessType: always, forwardType: manual, port: 4443 });
        expect(persistence.getConfig()).toMatchObject({
            wanaccess: true,
            wanport: 4443,
            upnpEnabled: false,
            certificateManagementEnabled: true,
            tunnelRemoteAccessEnabled: true,
            serverDataReportingEnabled: true,
        });
        expect(JSON.parse(await readFile(persistence.configPath(), 'utf8')).wanport).toBe(4443);
        expect(client.createMapping).not.toHaveBeenCalled();
        expect(network.reloadNetworkStack).toHaveBeenCalledOnce();
        expect(service.settings()).toMatchObject({
            accessType: always,
            forwardType: manual,
            port: 4443,
        });
    });
    it('creates, renews, and removes a UPnP lease', async () => {
        await service.update({ accessType: always, forwardType: automatic });
        const port = service.settings().port;
        expect(port).toBeGreaterThanOrEqual(35000);
        expect(client.createMapping).toHaveBeenCalledWith(
            expect.objectContaining({ public: port, private: 443 })
        );
        await upnp.handleUpnpRenewal();
        expect(client.createMapping).toHaveBeenCalledTimes(2);
        expect(client.removeMapping).not.toHaveBeenCalled();
        await service.update({ accessType: off });
        expect(client.removeMapping).toHaveBeenCalledWith({ public: port, private: 443 });
        expect(upnp.enabled).toBe(false);
        expect(persistence.getConfig().tunnelRemoteAccessEnabled).toBe(true);
    });
    it('resumes saved UPnP settings and port on startup', async () => {
        await persistence.update({ wanaccess: true, upnpEnabled: true, wanport: 54321 });
        await service.reload();
        expect(client.createMapping).toHaveBeenCalledWith(
            expect.objectContaining({ public: 54321, private: 443 })
        );
        expect(persistence.getConfig().wanport).toBe(54321);
    });
    it('removes the lease on sign-out but keeps forwarding preferences', async () => {
        await service.update({ accessType: always, forwardType: automatic });
        await persistence.update({ apikey: '', username: '' });
        await service.reload();
        expect(upnp.enabled).toBe(false);
        expect(persistence.getConfig()).toMatchObject({ wanaccess: true, upnpEnabled: true });
        expect(config.get('connect.dynamicRemoteAccess.runningType')).toBe('DISABLED');
    });
    it('preserves concurrent native-feature changes during a direct-access update', async () => {
        await Promise.all([
            service.update({ accessType: always, forwardType: manual, port: 4443 }),
            persistence.update({ serverDataReportingEnabled: false }),
        ]);
        expect(persistence.getConfig()).toMatchObject({
            wanaccess: true,
            wanport: 4443,
            serverDataReportingEnabled: false,
        });
    });
    it('keeps direct access off if the router rejects the mapping', async () => {
        client.createMapping.mockRejectedValue(new Error('Router refused mapping'));
        await expect(service.update({ accessType: always, forwardType: automatic })).rejects.toThrow();
        expect(persistence.getConfig()).toMatchObject({
            wanaccess: false,
            upnpEnabled: false,
            tunnelRemoteAccessEnabled: true,
        });
    });
    it.each([0, 65536, 1.5, null])('rejects an invalid manual WAN port: %s', async (port) => {
        await expect(
            service.update({ accessType: always, forwardType: manual, port })
        ).rejects.toThrow();
        expect(client.createMapping).not.toHaveBeenCalled();
    });
    it('exposes the existing manual and UPnP settings surface', async () => {
        const slice = await service.buildSlice();
        expect(JSON.stringify(slice)).toContain('#/properties/remote-access/properties/forwardType');
        expect(JSON.stringify(slice)).toContain('UPNP');
        expect(JSON.stringify(slice)).toContain('STATIC');
    });
});
