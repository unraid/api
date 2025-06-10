import { Inject, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { configFeature } from './model/connect-config.model.js';
import { ConnectModule } from './module/connect.module.js';
import { MothershipModule } from './module/mothership.module.js';
import { ConnectConfigPersister } from './service/config.persistence.js';

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
