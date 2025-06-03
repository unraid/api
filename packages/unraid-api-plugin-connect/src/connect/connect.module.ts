import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RemoteAccessModule } from '../remote-access/remote-access.module.js';
import { ConnectApiKeyService } from './connect-api-key.service.js';
import { ConnectConfigService } from './connect-config.service.js';
import { ConnectLoginHandler } from './connect-login.handler.js';
import { ConnectSettingsResolver } from './connect-settings.resolver.js';
import { ConnectSettingsService } from './connect-settings.service.js';
import { ConnectResolver } from './connect.resolver.js';
import { SsoUserService } from './sso-user.service.js';

@Module({
    imports: [RemoteAccessModule, ConfigModule],
    providers: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectApiKeyService,
        ConnectSettingsResolver,
        SsoUserService,
        ConnectResolver,
        ConnectConfigService,
    ],
    exports: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectApiKeyService,
        ConnectSettingsResolver,
        SsoUserService,
        ConnectResolver,
        ConnectConfigService,
        RemoteAccessModule,
    ],
})
export class ConnectModule {}
