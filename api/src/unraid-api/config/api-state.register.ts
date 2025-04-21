import type { DynamicModule, Provider } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import type { ApiStateConfigOptions } from '@app/unraid-api/config/api-state.model.js';
import type { ApiStateConfigPersistenceOptions } from '@app/unraid-api/config/api-state.service.js';
import { ApiStateConfig } from '@app/unraid-api/config/api-state.model.js';
import { ScheduledConfigPersistence } from '@app/unraid-api/config/api-state.service.js';
import { makeConfigToken } from '@app/unraid-api/config/config.injection.js';
import { ConfigPersistenceHelper } from '@app/unraid-api/config/persistence.helper.js';

type ApiStateRegisterOptions<ConfigType> = ApiStateConfigOptions<ConfigType> & {
    persistence?: ApiStateConfigPersistenceOptions;
};

export class ApiStateConfigModule {
    static async register<ConfigType>(
        options: ApiStateRegisterOptions<ConfigType>
    ): Promise<DynamicModule> {
        const { persistence, ...configOptions } = options;
        const configToken = makeConfigToken(options.name);
        const persistenceToken = makeConfigToken(options.name, ScheduledConfigPersistence.name);
        const ConfigProvider = {
            provide: configToken,
            useFactory: async (helper: ConfigPersistenceHelper) => {
                const config = new ApiStateConfig(configOptions, helper);
                await config.load();
                return config;
            },
            inject: [ConfigPersistenceHelper],
        };

        const providers: Provider[] = [ConfigProvider, ConfigPersistenceHelper];
        const exports = [configToken];
        if (persistence) {
            providers.push({
                provide: persistenceToken,
                useFactory: (
                    schedulerRegistry: SchedulerRegistry,
                    config: ApiStateConfig<ConfigType>
                ) => {
                    return new ScheduledConfigPersistence(schedulerRegistry, config, persistence);
                },
                inject: [SchedulerRegistry, configToken],
            });
            exports.push(persistenceToken);
        }

        return {
            module: ApiStateConfigModule,
            providers,
            exports,
        };
    }
}
