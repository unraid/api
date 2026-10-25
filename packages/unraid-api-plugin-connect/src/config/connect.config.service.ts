import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { unlink } from 'node:fs/promises';

import { isMatch } from 'lodash-es';

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
        const config = {
            ...this.getConfig(),
            ...identity,
        };
        const persister = new ConnectConfigPersister(this.configService);
        await persister.persist(config);
        const savedConfig = await persister.getFileHandler().readConfigFile();
        if (!isMatch(savedConfig, identity)) {
            throw new Error('Connect sign-out could not persist cleared identity');
        }
        // Keep memory aligned with the cleared file before legacy cleanup. If
        // that cleanup fails, shutdown persistence must not restore the key.
        this.configService.set(this.configKey, config);

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
