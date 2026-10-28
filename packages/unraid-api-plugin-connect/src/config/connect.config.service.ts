import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { readFile, unlink } from 'node:fs/promises';

import { isMatch } from 'lodash-es';
import { parse as parseIni } from 'ini';

import { EVENTS } from '../helper/nest-tokens.js';
import { ConnectConfigPersister } from './config.persistence.js';
import { ConfigType, emptyMyServersConfig, MyServersConfig } from './connect.config.js';

/** The identity was cleared, but removal of the legacy credential file failed. */
export class ConnectLegacyCleanupError extends Error {
    constructor(cause: unknown) {
        super('Connect sign-out could not remove the legacy credential file', { cause });
    }
}

@Injectable()
export class ConnectConfigService {
    public readonly configKey = 'connect.config';
    private readonly logger = new Logger(ConnectConfigService.name);
    constructor(private readonly configService: ConfigService<ConfigType>) {}

    getConfig(): MyServersConfig {
        return this.configService.getOrThrow<MyServersConfig>(this.configKey);
    }

    async revokeCloudKey(): Promise<void> {
        const apiKeys = new Set<string>();
        const currentKey = this.getConfig().apikey;
        if (currentKey) apiKeys.add(currentKey);

        const legacyPath = this.configService.get<string>(
            'PATHS_MY_SERVERS_CONFIG',
            '/boot/config/plugins/dynamix.my.servers/myservers.cfg'
        );
        if (legacyPath) {
            const legacyContent = await readFile(legacyPath, 'utf8').catch(
                (error: NodeJS.ErrnoException) => {
                    if (error.code === 'ENOENT') return null;
                    throw error;
                }
            );
            if (legacyContent !== null) {
                const legacyConfig = parseIni(legacyContent);
                const legacyKey: unknown = legacyConfig.remote?.apikey;
                if (legacyKey != null && typeof legacyKey !== 'string') {
                    throw new Error('Connect legacy key could not be read');
                }
                if (legacyKey) apiKeys.add(legacyKey);
            }
        }
        if (apiKeys.size === 0) return;

        const mothership = new URL(this.configService.getOrThrow<string>('MOTHERSHIP_GRAPHQL_LINK'));
        if (mothership.protocol !== 'https:') {
            throw new Error('Connect key revocation requires HTTPS');
        }

        const endpoint = new URL('/ks/server/self-unregister', mothership);
        for (const apiKey of apiKeys) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'x-api-key': apiKey },
                redirect: 'error',
                signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok) throw new Error('Connect cloud key revocation failed');

            const result: unknown = await response.json();
            if (
                !result ||
                typeof result !== 'object' ||
                !('revoked' in result) ||
                result.revoked !== true
            ) {
                throw new Error('Connect cloud key revocation was not confirmed');
            }
        }
    }

    getExtraOrigins(): string[] {
        const extraOrigins = this.configService.get<string>('store.config.api.extraOrigins');
        if (extraOrigins) {
            return extraOrigins
                .replaceAll(' ', '')
                .split(',')
                .filter((origin) => origin.startsWith('http://') || origin.startsWith('https://'));
        }
        return [];
    }

    getSandboxOrigins(): string[] {
        const introspectionFlag = this.configService.get<boolean>('GRAPHQL_INTROSPECTION');
        if (introspectionFlag) {
            return ['https://studio.apollographql.com'];
        }
        return [];
    }

    /**
     * Clear the user's identity from the config.
     *
     * This is used when the user logs out.
     * It retains the existing config, but resets identity-related fields.
     */
    async resetUser() {
        // overwrite identity fields, but retain destructured fields
        const { wanaccess, wanport, upnpEnabled, ...identity } = {
            ...emptyMyServersConfig(),
            email: '',
        };
        const previousConfig = this.getConfig();
        const config = {
            ...previousConfig,
            ...identity,
        };
        const persister = new ConnectConfigPersister(this.configService);
        this.configService.set(this.configKey, config);
        try {
            await persister.persist(config);
            const savedConfig = await persister.getFileHandler().readConfigFile();
            if (!isMatch(savedConfig, identity)) {
                throw new Error('Connect sign-out could not persist cleared identity');
            }
        } catch (error) {
            this.configService.set(this.configKey, previousConfig);
            throw error;
        }

        const legacyPath = this.configService.get<string>(
            'PATHS_MY_SERVERS_CONFIG',
            '/boot/config/plugins/dynamix.my.servers/myservers.cfg'
        );
        if (legacyPath) {
            await unlink(legacyPath).catch((error: NodeJS.ErrnoException) => {
                if (error.code !== 'ENOENT') throw new ConnectLegacyCleanupError(error);
            });
        }
        this.logger.verbose('Reset Connect user identity');
    }

    @OnEvent(EVENTS.LOGOUT, { async: true })
    async onLogout({ configResetCompleted = false }: { configResetCompleted?: boolean } = {}) {
        if (configResetCompleted) return;
        await this.resetUser();
    }
}
