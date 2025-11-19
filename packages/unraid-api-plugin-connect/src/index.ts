import { Inject, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConnectConfigPersister } from './config/config.persistence.js';
import { configFeature } from './config/connect.config.js';
import { MothershipModule } from './mothership-proxy/mothership.module.js';
import { ConnectPluginService } from './unraid-connect/connect-plugin.service.js';
import { isConnectPluginInstalled } from './unraid-connect/connect-plugin.utils.js';
import { ConnectModule } from './unraid-connect/connect.module.js';

export const adapter = 'nestjs';

/**
 * When the plugin is installed we expose the full Nest module graph.
 * Configuration and proxy submodules only bootstrap in this branch.
 */
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

/**
 * Fallback module keeps the export shape intact but only warns operators.
 * This makes `ApiModule` safe to import even when the plugin is absent.
 */
@Module({
    providers: [ConnectPluginService],
})
export class DisabledConnectPluginModule {}

/**
 * Downstream code always imports `ApiModule`. We swap the implementation based on availability,
 * avoiding dynamic module plumbing while keeping the DI graph predictable.
 * Set `SKIP_CONNECT_PLUGIN_CHECK=true` in development to force the connected path.
 */
export const ApiModule = isConnectPluginInstalled() ? ConnectPluginModule : DisabledConnectPluginModule;
