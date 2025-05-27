import { forwardRef, Module } from '@nestjs/common';

import { BackupDestinationService } from '@app/unraid-api/graph/resolvers/backup/destination/backup-destination.service.js';
import { RCloneDestinationProcessor } from '@app/unraid-api/graph/resolvers/backup/destination/rclone/rclone-destination-processor.service.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';

@Module({
    imports: [forwardRef(() => RCloneModule)],
    providers: [RCloneApiService, BackupDestinationService, RCloneDestinationProcessor],
    exports: [BackupDestinationService, RCloneDestinationProcessor],
})
export class BackupDestinationModule {}
