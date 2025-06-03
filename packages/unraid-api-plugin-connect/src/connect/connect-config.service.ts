import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { ConfigType, emptyMyServersConfig, MyServersConfig } from '../config.entity.js';
import { EVENTS } from '../pubsub/consts.js';

@Injectable()
export class ConnectConfigService {
    public readonly configKey = 'connect.config';
    constructor(private readonly configService: ConfigService<ConfigType>) {}

    getConfig(): MyServersConfig {
        return this.configService.getOrThrow<MyServersConfig>(this.configKey);
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
    }

    @OnEvent(EVENTS.LOGOUT, { async: true })
    async onLogout() {
        this.resetUser();
    }
}
