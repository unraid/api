import { Inject, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'node:fs';

import { execa } from 'execa';

import { ConnectConfigPersister } from './config/config.persistence.js';
import { configFeature } from './config/connect.config.js';
import { MothershipModule } from './mothership-proxy/mothership.module.js';
import { ConnectModule } from './unraid-connect/connect.module.js';
import { Timeout } from '@nestjs/schedule';

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
@Module({})
export class DisabledConnectPluginModule {
    logger = new Logger(DisabledConnectPluginModule.name);

    constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

    @Timeout(1_000)
    async pruneStaleConnectPluginEntry() {
        const removalCommand = 'unraid-api plugins remove -b unraid-api-plugin-connect --no-restart';
        this.logger.warn(
            'Connect plugin is not installed, but is listed as an API plugin. Attempting `%s` automatically.',
            removalCommand
        );

        const apiConfig = this.configService.get('api') || {};
        const plugins = apiConfig.plugins || [];
        const updatedPlugins = plugins.filter((p: string) => p !== 'unraid-api-plugin-connect');
        this.configService.set('api', { ...apiConfig, plugins: updatedPlugins });

        // Allow config subscription to flush to disk (25ms buffer + margin)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const debugPlugins = this.configService.get<string[]>('api.plugins') || [];
        this.logger.debug('Plugins before running removal command: %o', debugPlugins);

        try {
            const { stdout, stderr } = await execa(
                'unraid-api',
                ['plugins', 'remove', '-b', 'unraid-api-plugin-connect', '--no-restart'],
                { shell: 'bash', extendEnv: true }
            );

            if (stdout?.trim()) {
                this.logger.debug(stdout.trim());
            }

            if (stderr?.trim()) {
                this.logger.debug(stderr.trim());
            }

            this.logger.log(
                'Successfully completed `%s` to prune the stale connect plugin entry.',
                removalCommand
            );

            setTimeout(() => {
                const debugPlugins = this.configService.get<string[]>('api.plugins') || [];
                const debugApiConfig = this.configService.get('api') || {};
                this.logger.debug('Plugins after running removal command: %o', debugPlugins);
                this.logger.debug('API config after running removal command: %o', debugApiConfig);
            }, 3_000);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unknown error while restarting API.';
            this.logger.error('Failed to restart API: %s', message);
        }
    }
}

/**
 * Local filesystem and env checks stay synchronous so we can branch at module load.
 */
const isConnectPluginInstalled = () => {
    if (process.env.SKIP_CONNECT_PLUGIN_CHECK === 'true') {
        return true;
    }
    return existsSync('/boot/config/plugins/dynamix.unraid.net.plg');
};

/**
 * Downstream code always imports `ApiModule`. We swap the implementation based on availability,
 * avoiding dynamic module plumbing while keeping the DI graph predictable.
 * Set `SKIP_CONNECT_PLUGIN_CHECK=true` in development to force the connected path.
 */
export const ApiModule = isConnectPluginInstalled() ? ConnectPluginModule : DisabledConnectPluginModule;
