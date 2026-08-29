import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigType, MyServersConfig } from './connect.config.js';

@Injectable()
export class ConnectConfigService {
    public readonly configKey = 'connect.config';
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
}
