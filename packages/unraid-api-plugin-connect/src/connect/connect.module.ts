import { Module } from '@nestjs/common';

import { RemoteAccessModule } from '../remote-access/remote-access.module.js';
import { ConnectApiKeyService } from './connect-api-key.service.js';
import { ConnectLoginHandler } from './connect-login.handler.js';
import { ConnectSettingsResolver } from './connect-settings.resolver.js';
import { ConnectSettingsService } from './connect-settings.service.js';

@Module({
    imports: [RemoteAccessModule],
    providers: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectApiKeyService,
        ConnectSettingsResolver,
    ],
    exports: [
        ConnectSettingsService,
        ConnectLoginHandler,
        ConnectApiKeyService,
        ConnectSettingsResolver,
    ],
})
export class ConnectModule {}
