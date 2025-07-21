import { Injectable, Logger, Module } from '@nestjs/common';
import { registerAs } from '@nestjs/config';

import type { ApiConfig } from '@unraid/shared/services/api-config.js';
import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { csvStringToArray } from '@unraid/shared/util/data.js';

import { API_VERSION } from '@app/environment.js';
import { ApiStateConfig } from '@app/unraid-api/config/factory/api-state.model.js';
import { ConfigPersistenceHelper } from '@app/unraid-api/config/persistence.helper.js';

export { type ApiConfig };

const logger = new Logger('ApiConfig');

const createDefaultConfig = (): ApiConfig => ({
    version: API_VERSION,
    extraOrigins: [],
    sandbox: false,
    ssoSubIds: [],
    plugins: [],
});

export const persistApiConfig = async (config: ApiConfig) => {
    const apiConfig = new ApiStateConfig<ApiConfig>(
        {
            name: 'api',
            defaultConfig: config,
            parse: (data) => data as ApiConfig,
        },
        new ConfigPersistenceHelper()
    );
    return await apiConfig.persist(config);
};

export const loadApiConfig = async () => {
    try {
        const defaultConfig = createDefaultConfig();
        const apiConfig = new ApiStateConfig<ApiConfig>(
            {
                name: 'api',
                defaultConfig,
                parse: (data) => data as ApiConfig,
            },
            new ConfigPersistenceHelper()
        );

        let diskConfig: ApiConfig | undefined;
        try {
            diskConfig = await apiConfig.parseConfig();
        } catch (error) {
            logger.error('Failed to load API config from disk, using defaults:', error);
            diskConfig = undefined;

            // Try to overwrite the invalid config with defaults to fix the issue
            try {
                const configToWrite = {
                    ...defaultConfig,
                    version: API_VERSION,
                };

                const writeSuccess = await apiConfig.persist(configToWrite);
                if (writeSuccess) {
                    logger.log('Successfully overwrote invalid config file with defaults.');
                } else {
                    logger.error(
                        'Failed to overwrite invalid config file. Continuing with defaults in memory only.'
                    );
                }
            } catch (persistError) {
                logger.error('Error during config file repair:', persistError);
            }
        }

        return {
            ...defaultConfig,
            ...diskConfig,
            version: API_VERSION,
        };
    } catch (outerError) {
        // This should never happen, but ensures the config factory never throws
        logger.error('Critical error in loadApiConfig, using minimal defaults:', outerError);
        return createDefaultConfig();
    }
};

/**
 * Loads the API config from disk. If not found, returns the default config, but does not persist it.
 */
export const apiConfig = registerAs<ApiConfig>('api', loadApiConfig);

@Injectable()
export class ApiConfigPersistence extends ConfigFilePersister<ApiConfig> {
    fileName(): string {
        return 'api.json';
    }

    configKey(): string {
        return 'api';
    }

    defaultConfig(): ApiConfig {
        return createDefaultConfig();
    }

    async migrateConfig(): Promise<ApiConfig> {
        const legacyConfig = this.configService.get('store.config', {});
        const migrated = this.convertLegacyConfig(legacyConfig);
        return {
            ...this.defaultConfig(),
            ...migrated,
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
    providers: [ApiConfigPersistence],
})
export class ApiConfigModule {}
