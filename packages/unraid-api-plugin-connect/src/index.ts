import { Inject, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';

import { configFeature } from './config.entity.js';
import { ConnectConfigPersister } from './config.persistence.js';
import { ConnectModule } from './connect/connect.module.js';
import { ConnectResolver } from './connect/connect.resolver.js';
import { HealthResolver } from './connect/health.resolver.js';
import { MothershipModule } from './mothership/mothership.module.js';

// import { MothershipConnectionService } from './mothership/connection.service.js';
// import { MothershipGraphqlClientService } from './mothership/graphql.client.js';
// import { MothershipHandler } from './mothership/mothership.handler.js';
// import { RemoteAccessModule } from './remote-access/remote-access.module.js';

export const adapter = 'nestjs';

@Module({
    imports: [ConfigModule.forFeature(configFeature), ConnectModule, MothershipModule],
    providers: [
        HealthResolver,
        ConnectConfigPersister,
        // PrefixedID,
        // Disabled for an experiment
        // MothershipHandler,
        // MothershipConnectionService,
        // GraphqlClientService,
    ],
    exports: [],
})
class ConnectPluginModule {
    logger = new Logger(ConnectPluginModule.name);

    constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

    onModuleInit() {
        this.logger.log('Connect plugin initialized with %o', this.configService.get('connect'));
    }
}

export const ApiModule = ConnectPluginModule;
