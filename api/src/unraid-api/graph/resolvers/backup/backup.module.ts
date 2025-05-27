import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { BackupConfigService } from '@app/unraid-api/graph/resolvers/backup/backup-config.service.js';
import { BackupMutationsResolver } from '@app/unraid-api/graph/resolvers/backup/backup-mutations.resolver.js';
import {
    BackupJobConfigResolver,
    BackupResolver,
} from '@app/unraid-api/graph/resolvers/backup/backup.resolver.js';
import { BackupDestinationModule } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.module.js';
import { BackupJobStatusResolver } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.resolver.js';
import { BackupJobTrackingService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-tracking.service.js';
import { BackupOrchestrationService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-orchestration.service.js';
import { BackupSourceModule } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.module.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';

@Module({
    imports: [RCloneModule, ScheduleModule.forRoot(), BackupSourceModule, BackupDestinationModule],
    providers: [
        BackupResolver,
        BackupJobConfigResolver,
        BackupMutationsResolver,
        BackupConfigService,
        BackupOrchestrationService,
        BackupJobTrackingService,
        BackupJobStatusResolver,
    ],
    exports: [forwardRef(() => BackupOrchestrationService), BackupJobTrackingService],
})
export class BackupModule {}
