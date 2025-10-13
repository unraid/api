import { Injectable, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService, registerAs } from '@nestjs/config';
import path from 'path';

import type { ApiConfig } from '@unraid/shared/services/api-config.js';
import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { csvStringToArray } from '@unraid/shared/util/data.js';

import { isConnectPluginInstalled } from '@app/connect-plugin-cleanup.js';
import { API_VERSION, PATHS_CONFIG_MODULES } from '@app/environment.js';
import { OnboardingTrackerModule } from '@app/unraid-api/config/onboarding-tracker.module.js';

export { type ApiConfig };

const createDefaultConfig = (): ApiConfig => ({
    version: API_VERSION,
    extraOrigins: [],
    sandbox: false,
    ssoSubIds: [],
    plugins: [],
});

/**
 * Simple file-based config loading for plugin discovery (outside of nestjs DI container).
 * This avoids complex DI container instantiation during module loading.
 *
 * @throws {Error} if the config file is not found or cannot be parsed
 */
export const loadApiConfig = async () => {
    const defaultConfig = createDefaultConfig();
    const apiHandler = new ApiConfigPersistence(new ConfigService()).getFileHandler();

    const diskConfig: Partial<ApiConfig> = await apiHandler.loadConfig();
    // Hack: cleanup stale connect plugin entry if necessary
    if (!isConnectPluginInstalled()) {
        diskConfig.plugins = diskConfig.plugins?.filter(
            (plugin) => plugin !== 'unraid-api-plugin-connect'
        );
        await apiHandler.writeConfigFile(diskConfig as ApiConfig);
    }

    return {
        ...defaultConfig,
        ...diskConfig,
        // diskConfig's version may be older, but we still want to use the correct version
        version: API_VERSION,
    };
};

/**
 * Loads the API config from disk. If not found, returns the default config, but does not persist it.
 * This is used in the root config module to register the api config.
 */
export const apiConfig = registerAs<ApiConfig>('api', loadApiConfig);

@Injectable()
export class ApiConfigPersistence
    extends ConfigFilePersister<ApiConfig>
    implements OnApplicationBootstrap
{
    constructor(configService: ConfigService) {
        super(configService);
    }

    fileName(): string {
        return 'api.json';
    }

    configKey(): string {
        return 'api';
    }

    /**
     * @override
     * Since the api config is read outside of the nestjs DI container,
     * we need to provide an explicit path instead of relying on the
     * default prefix from the configService.
     *
     * @returns The path to the api config file
     */
    configPath(): string {
        return path.join(PATHS_CONFIG_MODULES, this.fileName());
    }

    defaultConfig(): ApiConfig {
        return createDefaultConfig();
    }

    async onApplicationBootstrap() {
        this.configService.set('api.version', API_VERSION);
    }

    async migrateConfig(): Promise<ApiConfig> {
        const legacyConfig = this.configService.get('store.config', {});
        const migrated = this.convertLegacyConfig(legacyConfig);
        return {
            ...this.defaultConfig(),
            ...migrated,
            version: API_VERSION,
        };
    }

    convertLegacyConfig(
        config?: Partial<{
            local: { sandbox?: string };
            api: { extraOrigins?: string };
            remote: { ssoSubIds?: string };
        }>
    ) {
        return {
            sandbox: config?.local?.sandbox === 'yes',
            extraOrigins: csvStringToArray(config?.api?.extraOrigins ?? '').filter(
                (origin) => origin.startsWith('http://') || origin.startsWith('https://')
            ),
            ssoSubIds: csvStringToArray(config?.remote?.ssoSubIds ?? ''),
        };
    }
}

// apiConfig should be registered in root config in app.module.ts, not here.
@Module({
    imports: [OnboardingTrackerModule],
    providers: [ApiConfigPersistence],
    exports: [ApiConfigPersistence, OnboardingTrackerModule],
})
export class ApiConfigModule {}
