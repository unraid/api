// This modules syncs the legacy config with the nest config

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { loadAppEnvironment, loadLegacyStore } from '@app/unraid-api/config/config.loader.js';
import { StoreSyncService } from '@app/unraid-api/config/store-sync.service.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadAppEnvironment, loadLegacyStore],
        }),
    ],
    providers: [StoreSyncService],
    exports: [StoreSyncService],
})
export class LegacyConfigModule {}
