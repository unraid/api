import { DynamicModule, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import type { ApiStateConfigOptions } from './api-state.model.js';
import type { ApiStateConfigPersistenceOptions } from './api-state.service.js';
import { ApiStateConfig } from './api-state.model.js';
import { ScheduledConfigPersistence } from './api-state.service.js';

type ApiStateRegisterOptions<ConfigType> = ApiStateConfigOptions<ConfigType> & {
    persistence?: ApiStateConfigPersistenceOptions;
};

export class ApiStateConfigModule {
    private static readonly logger = new Logger(ApiStateConfigModule.name);

    static async register<ConfigType>(
        options: ApiStateRegisterOptions<ConfigType>
    ): Promise<DynamicModule> {
        // Questions:
        // - What should the default persistence behavior be? No persistence or default options?
        // - Should a failure while loading a config be fatal or not?
        const { persistence = {}, ...configOptions } = options;
        const config = new ApiStateConfig(configOptions);
        const ConfigProvider = {
            provide: config.token,
            useFactory: async () => {
                await config.load();
                return config;
            },
        };
        const PersistenceProvider = {
            provide: ScheduledConfigPersistence.name,
            useFactory: (schedulerRegistry: SchedulerRegistry) => {
                return new ScheduledConfigPersistence(schedulerRegistry, config, persistence);
            },
            inject: [SchedulerRegistry],
        };

        return {
            module: ApiStateConfigModule,
            providers: [ConfigProvider, PersistenceProvider],
            exports: [ConfigProvider],
        };
    }
}
