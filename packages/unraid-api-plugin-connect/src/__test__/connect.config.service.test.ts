import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ConfigFileHandler } from '@unraid/shared/util/config-file-handler.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { emptyMyServersConfig } from '../config/connect.config.js';
import {
    ConnectConfigService,
    ConnectIdentityVerificationError,
} from '../config/connect.config.service.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { ConnectSettingsResolver } from '../unraid-connect/connect-settings.resolver.js';
import { ConnectSettingsService } from '../unraid-connect/connect-settings.service.js';

describe('ConnectConfigService sign-out', () => {
    const temporaryDirectories: string[] = [];

    afterEach(async () => {
        vi.unstubAllGlobals();
        await Promise.all(
            temporaryDirectories
                .splice(0)
                .map((directory) => rm(directory, { recursive: true, force: true }))
        );
    });

    it('revokes the cloud key before local sign-out and keeps it on cloud failure', async () => {
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            MOTHERSHIP_GRAPHQL_LINK: 'https://mothership.unraid.net/ws',
        });
        const service = new ConnectConfigService(configService);
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ revoked: true }) });
        vi.stubGlobal('fetch', fetchMock);

        await service.revokeCloudKey();
        expect(fetchMock).toHaveBeenCalledWith(
            new URL('https://mothership.unraid.net/ks/server/self-unregister'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'x-api-key': 'current-key' },
                redirect: 'error',
            })
        );

        fetchMock.mockResolvedValue({ ok: false });
        await expect(service.revokeCloudKey()).rejects.toThrow();
        expect(configService.get('connect.config.apikey')).toBe('current-key');
    });

    it('revokes distinct current and legacy keys before clearing either credential', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
            MOTHERSHIP_GRAPHQL_LINK: 'https://mothership.unraid.net/ws',
        });
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ revoked: true }) })
            .mockResolvedValueOnce({ ok: false });
        vi.stubGlobal('fetch', fetchMock);
        const service = new ConnectConfigService(configService);

        await expect(service.revokeCloudKey()).rejects.toThrow();
        expect(fetchMock.mock.calls.map(([, options]) => options.headers['x-api-key'])).toEqual([
            'current-key',
            'legacy-key',
        ]);
        expect(configService.get('connect.config.apikey')).toBe('current-key');
        expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
    });

    it('confirms both distinct keys before sign-out removes their local copies', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
            MOTHERSHIP_GRAPHQL_LINK: 'https://staging.mothership.unraid.net/ws',
        });
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ revoked: true }),
        });
        vi.stubGlobal('fetch', fetchMock);
        const service = new ConnectConfigService(configService);

        await service.revokeCloudKey();
        expect(
            fetchMock.mock.calls.map(([url, options]) => [url.toString(), options.headers['x-api-key']])
        ).toEqual([
            ['https://staging.mothership.unraid.net/ks/server/self-unregister', 'current-key'],
            ['https://staging.mothership.unraid.net/ks/server/self-unregister', 'legacy-key'],
        ]);
        await service.resetUser();
        expect(configService.get('connect.config.apikey')).toBe('');
        await expect(readFile(legacyPath)).rejects.toThrow();
    });

    it('persists the cleared identity and removes the legacy source of the key', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const configService = new ConfigService({
            connect: {
                config: {
                    ...emptyMyServersConfig(),
                    apikey: 'current-key',
                    username: 'signed-in-user',
                    email: 'signed-in@example.com',
                    wanaccess: true,
                    wanport: 33443,
                },
            },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });

        await new ConnectConfigService(configService).resetUser();

        const persisted = JSON.parse(await readFile(join(directory, 'connect.json'), 'utf8'));
        expect(persisted.apikey).toBe('');
        expect(persisted.username).toBe('');
        expect(persisted.email).toBe('');
        expect(configService.get('connect.config.email')).toBe('');
        expect(persisted.wanaccess).toBe(true);
        expect(persisted.wanport).toBe(33443);
        await expect(readFile(legacyPath)).rejects.toThrow();
    });

    it('waits for an earlier key write before persisting sign-out', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: join(directory, 'absent.cfg'),
        });
        const persister = new ConnectConfigPersister(configService);
        const handler = persister.getFileHandler();
        const writeConfigFile = handler.writeConfigFile.bind(handler);
        let releaseWrite!: () => void;
        let writeStarted!: () => void;
        const holdWrite = new Promise<void>((resolve) => {
            releaseWrite = resolve;
        });
        const started = new Promise<void>((resolve) => {
            writeStarted = resolve;
        });
        vi.spyOn(handler, 'writeConfigFile').mockImplementationOnce(async (config) => {
            writeStarted();
            await holdWrite;
            return writeConfigFile(config);
        });

        const oldWrite = persister.persist(persister.getConfig());
        await started;
        const signOut = new ConnectConfigService(configService).resetUser();
        releaseWrite();
        await Promise.all([oldWrite, signOut]);

        const persisted = JSON.parse(await readFile(join(directory, 'connect.json'), 'utf8'));
        expect(persisted.apikey).toBe('');
        expect(configService.get('connect.config.apikey')).toBe('');
    });

    it('retains local credentials when cloud revocation fails during sign-out', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });
        const emitter = new EventEmitter2();
        const connectConfig = new ConnectConfigService(configService);
        vi.spyOn(connectConfig, 'revokeCloudKey').mockRejectedValue(new Error('cloud unavailable'));
        const resetUser = vi.spyOn(connectConfig, 'resetUser');
        const resolver = new ConnectSettingsResolver(
            {} as ConnectSettingsService,
            emitter,
            connectConfig
        );

        await expect(resolver.connectSignOut()).rejects.toThrow('cloud unavailable');
        expect(resetUser).not.toHaveBeenCalled();
        expect(configService.get('connect.config.apikey')).toBe('current-key');
        expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
    });

    it('keeps the legacy config when the cleared identity cannot be persisted', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const blockedPath = join(directory, 'blocked');
        await writeFile(blockedPath, 'not a directory');
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: blockedPath,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });

        await expect(new ConnectConfigService(configService).resetUser()).rejects.toThrow();
        expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
        expect(configService.get('connect.config.apikey')).toBe('current-key');
    });

    it('does not restore a revoked key if reading back the cleared file fails', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'revoked-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: '',
        });
        const originalRead = ConfigFileHandler.prototype.readConfigFile;
        const read = vi.spyOn(ConfigFileHandler.prototype, 'readConfigFile');
        read.mockImplementationOnce(function (
            this: ConfigFileHandler<ReturnType<typeof emptyMyServersConfig>>
        ) {
            return originalRead.call(this);
        }).mockRejectedValueOnce(new Error('read failed'));
        try {
            await expect(new ConnectConfigService(configService).resetUser()).rejects.toThrow(
                ConnectIdentityVerificationError
            );
            expect(configService.get('connect.config.apikey')).toBe('');
            await new ConnectConfigPersister(configService).onModuleDestroy();
            const persisted = JSON.parse(await readFile(join(directory, 'connect.json'), 'utf8'));
            expect(persisted.apikey).toBe('');
        } finally {
            read.mockRestore();
        }
    });

    it('does not restore the key on shutdown when legacy cleanup fails', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await mkdir(legacyPath);
        const configService = new ConfigService({
            connect: {
                config: {
                    ...emptyMyServersConfig(),
                    apikey: 'current-key',
                    email: 'signed-in@example.com',
                },
            },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });

        await expect(new ConnectConfigService(configService).resetUser()).rejects.toThrow();
        expect(configService.get('connect.config.apikey')).toBe('');
        expect(configService.get('connect.config.email')).toBe('');
        await new ConnectConfigPersister(configService).onModuleDestroy();
        const persisted = JSON.parse(await readFile(join(directory, 'connect.json'), 'utf8'));
        expect(persisted.apikey).toBe('');
        expect(persisted.email).toBe('');
    });

    it('finishes disk cleanup before the sign-out mutation succeeds', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });
        const module = await Test.createTestingModule({
            imports: [EventEmitterModule.forRoot()],
            providers: [
                { provide: ConfigService, useValue: configService },
                { provide: ConnectSettingsService, useValue: {} },
                {
                    provide: ConnectConfigService,
                    useFactory: () => new ConnectConfigService(configService),
                },
                {
                    provide: ConnectSettingsResolver,
                    useFactory: (
                        settings: ConnectSettingsService,
                        emitter: EventEmitter2,
                        connectConfig: ConnectConfigService
                    ) => new ConnectSettingsResolver(settings, emitter, connectConfig),
                    inject: [ConnectSettingsService, EventEmitter2, ConnectConfigService],
                },
            ],
        }).compile();
        await module.init();

        try {
            const resetUser = vi.spyOn(module.get(ConnectConfigService), 'resetUser');
            vi.spyOn(module.get(ConnectConfigService), 'revokeCloudKey').mockResolvedValue();
            await expect(module.get(ConnectSettingsResolver).connectSignOut()).resolves.toBe(true);
            expect(resetUser).toHaveBeenCalledTimes(1);
            const persisted = JSON.parse(await readFile(join(directory, 'connect.json'), 'utf8'));
            expect(persisted.apikey).toBe('');
            await expect(readFile(legacyPath)).rejects.toThrow();
        } finally {
            await module.close();
        }
    });

    it('rejects the sign-out mutation when disk cleanup fails', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await writeFile(legacyPath, '[remote]\napikey="legacy-key"\n');
        const blockedPath = join(directory, 'blocked');
        await writeFile(blockedPath, 'not a directory');
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: blockedPath,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });
        const module = await Test.createTestingModule({
            imports: [EventEmitterModule.forRoot()],
            providers: [
                { provide: ConfigService, useValue: configService },
                { provide: ConnectSettingsService, useValue: {} },
                {
                    provide: ConnectConfigService,
                    useFactory: () => new ConnectConfigService(configService),
                },
                {
                    provide: ConnectSettingsResolver,
                    useFactory: (
                        settings: ConnectSettingsService,
                        emitter: EventEmitter2,
                        connectConfig: ConnectConfigService
                    ) => new ConnectSettingsResolver(settings, emitter, connectConfig),
                    inject: [ConnectSettingsService, EventEmitter2, ConnectConfigService],
                },
            ],
        }).compile();
        await module.init();

        try {
            vi.spyOn(module.get(ConnectConfigService), 'revokeCloudKey').mockResolvedValue();
            await expect(module.get(ConnectSettingsResolver).connectSignOut()).rejects.toThrow();
            expect(await readFile(legacyPath, 'utf8')).toContain('legacy-key');
        } finally {
            await module.close();
        }
    });

    it('tears down the relay when legacy cleanup fails after clearing the identity', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const legacyPath = join(directory, 'myservers.cfg');
        await mkdir(legacyPath);
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: legacyPath,
        });
        const emitter = new EventEmitter2();
        const emitAsync = vi.spyOn(emitter, 'emitAsync');
        const stopRelay = vi.fn().mockResolvedValue(undefined);
        emitter.on(EVENTS.LOGOUT, stopRelay);
        const connectConfig = new ConnectConfigService(configService);
        vi.spyOn(connectConfig, 'revokeCloudKey').mockResolvedValue();
        const resolver = new ConnectSettingsResolver(
            {} as ConnectSettingsService,
            emitter,
            connectConfig
        );

        await expect(resolver.connectSignOut()).rejects.toThrow();
        expect(emitAsync).toHaveBeenCalledWith(EVENTS.LOGOUT, expect.any(Object));
        expect(stopRelay).toHaveBeenCalledTimes(1);
        expect(configService.get('connect.config.apikey')).toBe('');
        const persisted = JSON.parse(await readFile(join(directory, 'connect.json'), 'utf8'));
        expect(persisted.apikey).toBe('');
    });

    it('tears down the relay when the cleared identity cannot be read back', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'connect-sign-out-'));
        temporaryDirectories.push(directory);
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
            PATHS_CONFIG_MODULES: directory,
            PATHS_MY_SERVERS_CONFIG: '',
        });
        const originalRead = ConfigFileHandler.prototype.readConfigFile;
        const read = vi.spyOn(ConfigFileHandler.prototype, 'readConfigFile');
        read.mockImplementationOnce(function (
            this: ConfigFileHandler<ReturnType<typeof emptyMyServersConfig>>
        ) {
            return originalRead.call(this);
        }).mockRejectedValueOnce(new Error('read failed'));
        const emitter = new EventEmitter2();
        const stopRelay = vi.fn().mockResolvedValue(undefined);
        emitter.on(EVENTS.LOGOUT, stopRelay);
        const connectConfig = new ConnectConfigService(configService);
        vi.spyOn(connectConfig, 'revokeCloudKey').mockResolvedValue();
        const resolver = new ConnectSettingsResolver(
            {} as ConnectSettingsService,
            emitter,
            connectConfig
        );

        try {
            await expect(resolver.connectSignOut()).rejects.toThrow(ConnectIdentityVerificationError);
            expect(stopRelay).toHaveBeenCalledTimes(1);
            expect(configService.get('connect.config.apikey')).toBe('');
        } finally {
            read.mockRestore();
        }
    });

    it('keeps the cleanup error and logs a logout listener failure', async () => {
        const configService = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'current-key' } },
        });
        const connectConfig = new ConnectConfigService(configService);
        vi.spyOn(connectConfig, 'revokeCloudKey').mockResolvedValue();
        const cleanupError = new ConnectIdentityVerificationError(new Error('read failed'));
        vi.spyOn(connectConfig, 'resetUser').mockRejectedValue(cleanupError);
        const emitter = new EventEmitter2();
        const listenerError = new Error('relay stop failed');
        vi.spyOn(emitter, 'emitAsync').mockRejectedValue(listenerError);
        const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        const resolver = new ConnectSettingsResolver(
            {} as ConnectSettingsService,
            emitter,
            connectConfig
        );

        try {
            await expect(resolver.connectSignOut()).rejects.toBe(cleanupError);
            expect(logError).toHaveBeenCalledWith(
                'Logout listeners failed after sign-out cleanup error',
                listenerError
            );
        } finally {
            logError.mockRestore();
        }
    });
});
