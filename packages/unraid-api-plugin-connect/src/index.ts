import { Inject, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConnectConfigPersister } from './config/config.persistence.js';
import { configFeature } from './config/connect.config.js';
import { MothershipModule } from './mothership-proxy/mothership.module.js';
import { ConnectModule } from './unraid-connect/connect.module.js';

export const adapter = 'nestjs';

@Module({
    imports: [ConfigModule.forFeature(configFeature), ConnectModule, MothershipModule],
    providers: [ConnectConfigPersister],
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
