import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';


import { ConnectLoginHandler } from '../authn/connect-login.events.js';
import { ConnectConfigService } from '../config/connect.config.service.js';
import { RemoteAccessModule } from '../remote-access/remote-access.module.js';
import { ConnectSettingsResolver } from './connect-settings.resolver.js';
import { ConnectSettingsService } from './connect-settings.service.js';
import { ConnectResolver } from './connect.resolver.js';

@Module({
    imports: [RemoteAccessModule, ConfigModule, UserSettingsModule],
    providers: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectSettingsResolver,
        ConnectResolver,
        ConnectConfigService,
    ],
    exports: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectSettingsResolver,
        ConnectResolver,
        ConnectConfigService,
        RemoteAccessModule,
    ],
})
export class ConnectModule {}
