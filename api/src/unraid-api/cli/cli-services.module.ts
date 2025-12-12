import { Module } from '@nestjs/common';

import { DependencyService } from '@app/unraid-api/app/dependency.service.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { NodemonService } from '@app/unraid-api/cli/nodemon.service.js';
import { ApiConfigModule } from '@app/unraid-api/config/api-config.module.js';
import { LegacyConfigModule } from '@app/unraid-api/config/legacy-config.module.js';
import { GlobalDepsModule } from '@app/unraid-api/plugin/global-deps.module.js';
import { PluginCliModule } from '@app/unraid-api/plugin/plugin.module.js';
import { UnraidFileModifierModule } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.module.js';

// This module provides only the services from CliModule without the CLI commands
// This avoids dependency issues with InquirerService when used in other modules
@Module({
    imports: [
        LegacyConfigModule,
        ApiConfigModule,
        GlobalDepsModule,
        PluginCliModule.register(),
        UnraidFileModifierModule,
    ],
    providers: [LogService, NodemonService, ApiKeyService, DependencyService, ApiReportService],
    exports: [ApiReportService, LogService, ApiKeyService],
})
export class CliServicesModule {}
