import { ConfigService } from '@nestjs/config';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { emptyMyServersConfig } from '../config/connect.config.js';
import {
    ConnectConfigService,
    ConnectIdentityVerificationError,
    ConnectLegacyCleanupError,
} from '../config/connect.config.service.js';

describe('Connect identity cleanup with native settings', () => {
    let directory: string;
    let legacyPath: string;
    let config: ConfigService;
    let persister: ConnectConfigPersister;
    let service: ConnectConfigService;

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        legacyPath = join(directory, 'myservers.cfg');
        config = new ConfigService({
            connect: {
                config: {
                    ...emptyMyServersConfig(),
                    apikey: 'current-key',
                    username: 'signed-in',
                    email: 'signed-in@example.com',
                    wanaccess: true,
                    wanport: 33443,
                    certificateManagementEnabled: true,
                    tunnelRemoteAccessEnabled: true,
                    serverDataReportingEnabled: true,
                    gatewayServicesRevision: 3,
                    gatewayServices: [
                        {
                            id: 'app-0123456789abcdef',
                            name: 'Example',
                            upstream: 'http://127.0.0.1:8080',
                            tlsServerName: '',
                            enabled: true,
                            auth: 'account',
                        },
                    ],
                },
            },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
            MOTHERSHIP_GRAPHQL_LINK: 'https://mothership.example/ws',
        });
        persister = new ConnectConfigPersister(config);
        await persister.save(persister.getConfig());
        service = new ConnectConfigService(config);
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        await rm(directory, { recursive: true, force: true });
    });

    it('confirms distinct current and legacy keys before deleting either local copy', async () => {
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const request = vi.fn().mockImplementation(async () => new Response('{"revoked":true}'));
        vi.stubGlobal('fetch', request);
        await service.revokeCloudKey();
        expect(request.mock.calls.map((call) => call[1].headers['x-api-key'])).toEqual([
            'current-key',
            'legacy-key',
        ]);
        expect(request.mock.calls[0][0].href).toBe(
            'https://mothership.example/ks/server/self-unregister'
        );
        expect(request.mock.calls[0][1]).toMatchObject({ method: 'POST', redirect: 'error' });
        expect(persister.getConfig().apikey).toBe('current-key');
        expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
        await service.resetUser(persister);
        expect(persister.getConfig().apikey).toBe('');
        await expect(readFile(legacyPath)).rejects.toThrow();
    });

    it.each([
        () => new Response('unavailable', { status: 503 }),
        () => new Response('{"revoked":false}'),
        () => new Response('{}'),
    ])('preserves credentials when revocation is refused or unconfirmed', async (response) => {
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        vi.stubGlobal(
            'fetch',
            vi.fn().mockImplementation(async () => response())
        );
        await expect(service.revokeCloudKey()).rejects.toThrow();
        expect(persister.getConfig().apikey).toBe('current-key');
        expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
    });

    it('rejects a non-HTTPS revocation endpoint without sending the key', async () => {
        config.set('MOTHERSHIP_GRAPHQL_LINK', 'http://mothership.example/ws');
        const request = vi.fn();
        vi.stubGlobal('fetch', request);
        await expect(service.revokeCloudKey()).rejects.toThrow();
        expect(request).not.toHaveBeenCalled();
    });

    it('preserves app routes, feature opt-ins, and forwarding preferences when clearing identity', async () => {
        const previous = JSON.parse(JSON.stringify(persister.getConfig()));
        await service.resetUser(persister);
        const saved = JSON.parse(await readFile(persister.configPath(), 'utf8'));
        expect(saved).toMatchObject({
            ...previous,
            apikey: '',
            localApiKey: '',
            username: '',
            avatar: '',
            regWizTime: '',
            email: '',
        });
        expect(config.get('connect.config')).toMatchObject(saved);
    });

    it('waits for a locked settings write and preserves its changes while clearing the key', async () => {
        const other = new ConnectConfigPersister(config);
        const persist = other.persist.bind(other);
        let release!: () => void;
        let started!: () => void;
        const hold = new Promise<void>((resolve) => {
            release = resolve;
        });
        const writing = new Promise<void>((resolve) => {
            started = resolve;
        });
        vi.spyOn(other, 'persist').mockImplementationOnce(async (value) => {
            started();
            await hold;
            return persist(value);
        });
        const update = other.update({ gatewayServicesRevision: 4 });
        await writing;
        const signOut = service.resetUser(persister);
        release();
        await Promise.all([update, signOut]);
        expect(JSON.parse(await readFile(persister.configPath(), 'utf8'))).toMatchObject({
            apikey: '',
            gatewayServicesRevision: 4,
            serverDataReportingEnabled: true,
        });
    });

    it('keeps credentials and legacy file when the durable clear fails', async () => {
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        vi.spyOn(persister, 'persist').mockRejectedValueOnce(new Error('disk unavailable'));
        await expect(service.resetUser(persister)).rejects.toThrow();
        expect(persister.getConfig().apikey).toBe('current-key');
        expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
    });

    it('keeps identity cleared through shutdown when post-write verification fails', async () => {
        vi.spyOn(persister.getFileHandler(), 'readConfigFile').mockRejectedValueOnce(
            new Error('read failed')
        );
        await expect(service.resetUser(persister)).rejects.toThrow(ConnectIdentityVerificationError);
        await persister.onModuleDestroy();
        expect(persister.getConfig().apikey).toBe('');
        expect(JSON.parse(await readFile(persister.configPath(), 'utf8')).apikey).toBe('');
    });

    it('reports legacy cleanup failure without restoring the cleared key', async () => {
        await mkdir(legacyPath);
        await expect(service.resetUser(persister)).rejects.toThrow(ConnectLegacyCleanupError);
        await persister.onModuleDestroy();
        expect(JSON.parse(await readFile(persister.configPath(), 'utf8')).apikey).toBe('');
    });

    it('isolates preview revocation and cleanup from normal legacy credentials', async () => {
        const previewLegacy = join(directory, 'preview.cfg');
        await writeFile(legacyPath, '[remote]\napikey="normal-key"\n');
        await writeFile(previewLegacy, '[remote]\napikey="preview-key"\n');
        config.set('CONNECT_LEGACY_PATH', previewLegacy);
        const request = vi.fn().mockImplementation(async () => new Response('{"revoked":true}'));
        vi.stubGlobal('fetch', request);
        await service.revokeCloudKey();
        expect(request.mock.calls.map((call) => call[1].headers['x-api-key'])).toEqual([
            'current-key',
            'preview-key',
        ]);
        await service.resetUser(persister);
        await expect(readFile(previewLegacy)).rejects.toThrow();
        expect(await readFile(legacyPath, 'utf8')).toContain('normal-key');
    });
});
