import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { ConfigType, emptyMyServersConfig, MyServersConfig } from '../model/config.entity.js';
import { EVENTS } from '../helper/nest-tokens.js';

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
    resetUser() {
        // overwrite identity fields, but retain destructured fields
        const { wanaccess, wanport, upnpEnabled, ssoSubIds, ...identity } = emptyMyServersConfig();
        this.configService.set(this.configKey, {
            ...this.getConfig(),
            ...identity,
        });
        this.logger.verbose('Reset Connect user identity');
    }

    @OnEvent(EVENTS.LOGOUT, { async: true })
    async onLogout() {
        this.resetUser();
    }
}
