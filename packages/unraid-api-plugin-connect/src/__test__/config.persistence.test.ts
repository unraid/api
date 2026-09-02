import { ConfigService } from '@nestjs/config';
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { withPrivateJsonLock } from '../config/private-json-file.js';
import { makeCertificate } from './certificate.fixture.js';

describe('Connect configuration persistence', () => {
    let directory: string;
    let config: ConfigService;
    let persister: ConnectConfigPersister;
    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'connect-config-'));
        config = new ConfigService({
            PATHS_CONFIG_MODULES: directory,
            CONNECT_CERT_BUNDLE_PATH: join(directory, 'bundle.pem'),
        });
        persister = new ConnectConfigPersister(config);
    });
    afterEach(async () => {
        await rm(directory, { recursive: true, force: true });
    });

    it('migrates identity and existing forwarding without opting into tunnel access or sharing', async () => {
        const ini =
            '[api]\nversion="6.12.0"\n[local]\nsandbox="no"\n[remote]\napikey="test-key"\nlocalApiKey="local-key"\nusername="user"\nemail="user@example.com"\nwanaccess="yes"\nwanport="3333"\nupnpEnabled="yes"\ndynamicRemoteAccessType="UPNP"';
        const legacy = persister.parseLegacyConfig(ini);
        expect(legacy.remote.wanport).toBe('3333');
        const migrated = await persister.convertLegacyConfig(legacy);
        expect(migrated).toMatchObject({
            apikey: 'test-key',
            localApiKey: 'local-key',
            username: 'user',
            email: 'user@example.com',
            wanaccess: true,
            wanport: 3333,
            upnpEnabled: true,
            dynamicRemoteAccessType: 'UPNP',
            certificateManagementEnabled: false,
            tunnelRemoteAccessEnabled: false,
            serverDataReportingEnabled: false,
        });
    });
    it('defaults only certificate management on for an existing myunraid certificate', async () => {
        makeCertificate(directory);
        expect(await persister.validate({})).toMatchObject({
            certificateManagementEnabled: true,
            tunnelRemoteAccessEnabled: false,
            serverDataReportingEnabled: false,
        });
        expect(
            (await persister.validate({ certificateManagementEnabled: false }))
                .certificateManagementEnabled
        ).toBe(false);
    });
    it('also adopts an existing non-wildcard myunraid certificate', () => {
        makeCertificate(directory, 'server.myunraid.net');
        expect(persister.defaultConfig().certificateManagementEnabled).toBe(true);
    });
    it('does not opt in from unrelated or malformed certificates', async () => {
        makeCertificate(directory, 'tower.local');
        expect(persister.defaultConfig().certificateManagementEnabled).toBe(false);
        await writeFile(join(directory, 'bundle.pem'), 'not a certificate');
        expect(persister.defaultConfig().certificateManagementEnabled).toBe(false);
    });
    it('persists settings atomically with private permissions and preserves explicit opt-out after reload', async () => {
        makeCertificate(directory);
        const value = await persister.validate({
            apikey: 'test-key',
            certificateManagementEnabled: false,
        });
        await persister.save(value);
        const file = await readFile(persister.configPath(), 'utf8');
        expect(JSON.parse(file)).toMatchObject({
            apikey: 'test-key',
            certificateManagementEnabled: false,
        });
        expect((await stat(persister.configPath())).mode & 0o777).toBe(0o600);
        expect((await persister.validate(JSON.parse(file))).certificateManagementEnabled).toBe(false);
        expect(config.get('connect.config')).toEqual(JSON.parse(file));
        await expect(stat(`${persister.configPath()}.tmp`)).rejects.toThrow();
    });
    it('merges each update over the latest shared on-disk configuration', async () => {
        await persister.save(await persister.validate({ apikey: 'test-key' }));
        const external = JSON.parse(await readFile(persister.configPath(), 'utf8'));
        external.gatewayServiceRoutes = {
            'app-0123456789abcdef':
                'tun-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-0123456789abcdef.example.preview.myunraid.net',
        };
        await writeFile(persister.configPath(), JSON.stringify(external));

        await persister.update({ username: 'updated' });

        expect(JSON.parse(await readFile(persister.configPath(), 'utf8'))).toMatchObject({
            username: 'updated',
            gatewayServiceRoutes: external.gatewayServiceRoutes,
        });
    });
    it('rechecks shared configuration after waiting for the startup writer lock', async () => {
        let releaseLock!: () => void;
        let reportLocked!: () => void;
        const release = new Promise<void>((resolve) => (releaseLock = resolve));
        const locked = new Promise<void>((resolve) => (reportLocked = resolve));
        const holding = withPrivateJsonLock(persister.configPath(), async () => {
            reportLocked();
            await release;
        });
        await locked;
        const starting = persister.onModuleInit();
        await delay(25);
        await writeFile(
            persister.configPath(),
            JSON.stringify({ apikey: 'newer-key', gatewayServicesRevision: 7 })
        );
        releaseLock();
        await holding;

        await starting;

        expect(JSON.parse(await readFile(persister.configPath(), 'utf8'))).toMatchObject({
            apikey: 'newer-key',
            gatewayServicesRevision: 7,
        });
    });
    it('allows only one concurrent writer into the critical section', async () => {
        let releaseFirst!: () => void;
        let reportFirstLocked!: () => void;
        const release = new Promise<void>((resolve) => (releaseFirst = resolve));
        const firstLocked = new Promise<void>((resolve) => (reportFirstLocked = resolve));
        const entries: string[] = [];
        const first = withPrivateJsonLock(persister.configPath(), async () => {
            entries.push('first');
            reportFirstLocked();
            await release;
        });
        await firstLocked;
        const second = withPrivateJsonLock(persister.configPath(), async () => {
            entries.push('second');
        });
        await delay(25);
        expect(entries).toEqual(['first']);
        releaseFirst();
        await Promise.all([first, second]);
        expect(entries).toEqual(['first', 'second']);
    });
    it('rejects a gateway write based on a stale cached revision', async () => {
        await persister.save(await persister.validate({ apikey: 'test-key' }));
        const external = JSON.parse(await readFile(persister.configPath(), 'utf8'));
        external.gatewayServicesRevision = 1;
        external.gatewayServices = [
            {
                id: 'app-0123456789abcdef',
                name: 'Plex',
                upstream: 'http://127.0.0.1:32400',
                tlsServerName: '',
                enabled: true,
                auth: 'upstream',
                providerId: '',
                subjects: [],
            },
        ];
        await writeFile(persister.configPath(), JSON.stringify(external));

        await expect(
            persister.updateIfGatewayRevision(0, {
                gatewayServicesRevision: 1,
                gatewayServices: [],
            })
        ).rejects.toThrow('Service settings changed');

        expect(JSON.parse(await readFile(persister.configPath(), 'utf8'))).toMatchObject({
            gatewayServicesRevision: 1,
            gatewayServices: external.gatewayServices,
        });
    });
    it('does not finalize an older gateway request over a newer revision', async () => {
        await persister.save(
            await persister.validate({
                apikey: 'test-key',
                gatewayServicesRevision: 2,
                gatewayServicesPending: true,
            })
        );

        await expect(
            persister.updateIfGatewayRevision(1, {
                gatewayServicesPending: false,
                gatewayServiceRoutes: {},
            })
        ).rejects.toThrow('Service settings changed');

        expect(JSON.parse(await readFile(persister.configPath(), 'utf8'))).toMatchObject({
            gatewayServicesRevision: 2,
            gatewayServicesPending: true,
        });
    });
    it('does not rewrite shared configuration during shutdown', async () => {
        await persister.save(await persister.validate({ apikey: 'test-key' }));
        const external = JSON.parse(await readFile(persister.configPath(), 'utf8'));
        external.gatewayServiceRoutes = {
            'app-0123456789abcdef':
                'tun-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-0123456789abcdef.example.preview.myunraid.net',
        };
        await writeFile(persister.configPath(), JSON.stringify(external));

        await persister.onModuleDestroy();

        expect(JSON.parse(await readFile(persister.configPath(), 'utf8'))).toMatchObject({
            gatewayServiceRoutes: external.gatewayServiceRoutes,
        });
    });
    it('uses an isolated Connect path without moving other API configuration', async () => {
        const connectPath = join(directory, 'preview', 'connect.json');
        const isolatedConfig = new ConfigService({
            PATHS_CONFIG_MODULES: directory,
            CONNECT_CONFIG_PATH: connectPath,
            CONNECT_CERT_BUNDLE_PATH: join(directory, 'bundle.pem'),
        });
        const isolatedPersister = new ConnectConfigPersister(isolatedConfig);
        await isolatedPersister.save(await isolatedPersister.validate({ apikey: 'preview-key' }));
        expect(isolatedPersister.configPath()).toBe(connectPath);
        expect(JSON.parse(await readFile(connectPath, 'utf8'))).toMatchObject({
            apikey: 'preview-key',
        });
    });
    it('loads saved opt-outs without reviving legacy credentials or resetting damaged config', async () => {
        makeCertificate(directory);
        await writeFile(
            persister.configPath(),
            JSON.stringify({ certificateManagementEnabled: false, apikey: '' })
        );
        await persister.onModuleInit();
        expect(persister.getConfig()).toMatchObject({ certificateManagementEnabled: false, apikey: '' });
        await chmod(persister.configPath(), 0o644);
        await persister.persist();
        expect((await stat(persister.configPath())).mode & 0o777).toBe(0o600);
        await writeFile(persister.configPath(), '{broken');
        await expect(persister.onModuleInit()).rejects.toThrow();
        expect(await readFile(persister.configPath(), 'utf8')).toBe('{broken');
    });
});
