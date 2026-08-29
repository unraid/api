import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { ConnectLoginHandler } from '../authn/connect-login.events.js';
import { ConnectConfigPersister } from '../config/config.persistence.js';
import { configFeature } from '../config/connect.config.js';
import { ConnectConfigService } from '../config/connect.config.service.js';
import { CloudResolver } from '../connection-status/cloud.resolver.js';
import { CloudService } from '../connection-status/cloud.service.js';
import { ConnectStatusWriterService } from '../connection-status/connect-status-writer.service.js';
import { NetworkModule } from '../network/network.module.js';
import { RemoteAccessService } from '../remote-access/remote-access.service.js';
import { ConnectTunnelSettingsResolver } from '../tunnel/connect-tunnel-settings.resolver.js';
import { ConnectTunnelService } from '../tunnel/connect-tunnel.service.js';
import { ConnectSettingsResolver } from './connect-settings.resolver.js';
import { ConnectSettingsService } from './connect-settings.service.js';
import { ConnectResolver } from './connect.resolver.js';

@Module({
    imports: [NetworkModule, ConfigModule.forFeature(configFeature), UserSettingsModule],
    providers: [
        RemoteAccessService,
        ConnectConfigPersister,
        ConnectTunnelService,
        ConnectTunnelSettingsResolver,
        CloudResolver,
        CloudService,
        ConnectStatusWriterService,
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
        NetworkModule,
    ],
})
export class ConnectModule {}
