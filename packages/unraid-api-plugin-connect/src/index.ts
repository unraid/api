import { Inject, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { configFeature } from './config.entity.js';
import { ConnectConfigPersister } from './config.persistence.js';
import { HealthResolver } from './connect.resolver.js';
import { MothershipConnectionService } from './mothership/connection.service.js';
import { MothershipGraphqlClientService } from './mothership/graphql.client.js';
import { MothershipHandler } from './mothership/mothership.handler.js';
import { RemoteAccessModule } from './remote-access/remote-access.module.js';

export const adapter = 'nestjs';

@Module({
    imports: [
        ConfigModule.forFeature(configFeature),
        RemoteAccessModule
    ],
    providers: [
        HealthResolver,
        ConnectConfigPersister,
        // Disabled for an experiment
        // MothershipHandler,
        // MothershipConnectionService,
        // GraphqlClientService,
    ],
})
class ConnectPluginModule {
    logger = new Logger(ConnectPluginModule.name);

    constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

    onModuleInit() {
        this.logger.log('Connect plugin initialized with %o', this.configService.get('connect'));
    }
}

export const ApiModule = ConnectPluginModule;
