import { Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService, registerAs } from '@nestjs/config';

import { csvStringToArray } from '@unraid/shared/util/data.js';
import { fileExists } from '@unraid/shared/util/file.js';
import { debounceTime } from 'rxjs/operators';

import { API_VERSION } from '@app/environment.js';
import { ApiStateConfig } from '@app/unraid-api/config/factory/api-state.model.js';
import { ConfigPersistenceHelper } from '@app/unraid-api/config/persistence.helper.js';

export interface ApiConfig {
    version: string;
    extraOrigins: string[];
    sandbox?: boolean;
    ssoSubIds: string[];
}

const createDefaultConfig = (): ApiConfig => ({
    version: API_VERSION,
    extraOrigins: [],
    sandbox: false,
    ssoSubIds: [],
});

/**
 * Loads the API config from disk. If not found, returns the default config, but does not persist it.
 */
export const apiConfig = registerAs<ApiConfig>('api', async () => {
    const defaultConfig = createDefaultConfig();
    const apiConfig = new ApiStateConfig<ApiConfig>(
        {
            name: 'api',
            defaultConfig,
            parse: (data) => data as ApiConfig,
        },
        new ConfigPersistenceHelper()
    );
    const diskConfig = await apiConfig.parseConfig();
    return {
        ...defaultConfig,
        ...diskConfig,
        version: API_VERSION,
    };
});

@Injectable()
class ApiConfigPersistence {
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
        if (!(await fileExists(this.filePath))) {
            this.migrateFromMyServersConfig();
        }
        await this.persistenceHelper.persistIfChanged(this.filePath, this.config);
        this.configService.changes$.pipe(debounceTime(500)).subscribe({
            next: async ({ newValue, oldValue, path }) => {
                if (path.startsWith('api')) {
                    this.logger.verbose(`Config changed: ${path} from ${oldValue} to ${newValue}`);
                    await this.persistenceHelper.persistIfChanged(this.filePath, newValue);
                }
            },
            error: (err) => {
                this.logger.error('Error receiving config changes:', err);
            },
        });
    }

    private migrateFromMyServersConfig() {
        const { local, api, remote } = this.configService.get('store.config', {});
        const sandbox = local?.sandbox;
        const extraOrigins = csvStringToArray(api?.extraOrigins ?? '').filter(
            (origin) => origin.startsWith('http://') || origin.startsWith('https://')
        );
        const ssoSubIds = remote?.ssoSubIds ?? [];

        this.configService.set('api.sandbox', sandbox === 'yes');
        this.configService.set('api.extraOrigins', extraOrigins);
        this.configService.set('api.ssoSubIds', ssoSubIds);
    }
}

// apiConfig should be registered in root config in app.module.ts, not here.
@Module({
    providers: [ApiConfigPersistence, ConfigPersistenceHelper],
})
export class ApiConfigModule {}
