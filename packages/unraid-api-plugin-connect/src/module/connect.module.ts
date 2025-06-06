import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConnectLoginHandler } from '../event-handler/connect-login.handler.js';
import { ConnectSettingsResolver } from '../resolver/connect-settings.resolver.js';
import { ConnectResolver } from '../resolver/connect.resolver.js';
import { ConnectApiKeyService } from '../service/connect-api-key.service.js';
import { ConnectConfigService } from '../service/connect-config.service.js';
import { ConnectSettingsService } from '../service/connect-settings.service.js';
import { RemoteAccessModule } from './remote-access.module.js';

@Module({
    imports: [RemoteAccessModule, ConfigModule],
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
