import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';
import { ConnectLoginHandler } from '../authn/connect-login.events.js';
import { ConnectConfigService } from '../config/connect.config.service.js';
import { ConnectSettingsResolver } from '../resolver/connect-settings.resolver.js';
import { ConnectResolver } from '../resolver/connect.resolver.js';
import { ConnectSettingsService } from '../service/connect-settings.service.js';
import { RemoteAccessModule } from './remote-access.module.js';

@Module({
    imports: [RemoteAccessModule, ConfigModule, UserSettingsModule],
    providers: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectApiKeyService,
        ConnectSettingsResolver,
        ConnectResolver,
        ConnectConfigService,
    ],
    exports: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectApiKeyService,
        ConnectSettingsResolver,
        ConnectResolver,
        ConnectConfigService,
        RemoteAccessModule,
    ],
})
export class ConnectModule {}
