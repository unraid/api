import { Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService, registerAs } from '@nestjs/config';

import type { ApiConfig } from '@unraid/shared/services/api-config.js';
import { csvStringToArray } from '@unraid/shared/util/data.js';
import { fileExists } from '@unraid/shared/util/file.js';
import { bufferTime } from 'rxjs/operators';

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
export class ApiConfigPersistence {
    private configModel: ApiStateConfig<ApiConfig>;
    private logger = new Logger(ApiConfigPersistence.name);
    get filePath() {
        return this.configModel.filePath;
    }
    get config() {
        return this.configService.getOrThrow('api');
    }

    constructor(
        private readonly configService: ConfigService,
        private readonly persistenceHelper: ConfigPersistenceHelper
    ) {
        this.configModel = new ApiStateConfig<ApiConfig>(
            {
                name: 'api',
                defaultConfig: createDefaultConfig(),
                parse: (data) => data as ApiConfig,
            },
            this.persistenceHelper
        );
    }

    async onModuleInit() {
        try {
            if (!(await fileExists(this.filePath))) {
                this.migrateFromMyServersConfig();
            }
            await this.persistenceHelper.persistIfChanged(this.filePath, this.config);
            this.configService.changes$.pipe(bufferTime(25)).subscribe({
                next: async (changes) => {
                    if (changes.some((change) => change.path.startsWith('api'))) {
                        this.logger.verbose(`API Config changed ${JSON.stringify(changes)}`);
                        try {
                            await this.persistenceHelper.persistIfChanged(this.filePath, this.config);
                        } catch (persistError) {
                            this.logger.error('Error persisting config changes:', persistError);
                        }
                    }
                },
                error: (err) => {
                    this.logger.error('Error receiving config changes:', err);
                },
            });
        } catch (error) {
            this.logger.error('Error during API config module initialization:', error);
        }
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

    migrateFromMyServersConfig() {
        const legacyConfig = this.configService.get('store.config', {});
        const { sandbox, extraOrigins, ssoSubIds } = this.convertLegacyConfig(legacyConfig);
        this.configService.set('api.sandbox', sandbox);
        this.configService.set('api.extraOrigins', extraOrigins);
        this.configService.set('api.ssoSubIds', ssoSubIds);
    }
}

// apiConfig should be registered in root config in app.module.ts, not here.
@Module({
    providers: [ApiConfigPersistence, ConfigPersistenceHelper],
})
export class ApiConfigModule {}
