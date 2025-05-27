import { forwardRef, Module } from '@nestjs/common';

import { BackupSourceService } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.service.js';
import { FlashSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-source-processor.service.js';
import { FlashValidationService } from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-validation.service.js';
import { RawSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/raw/raw-source-processor.service.js';
import { ScriptSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/script/script-source-processor.service.js';
import { ZfsSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-source-processor.service.js';
import { ZfsValidationService } from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-validation.service.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';
import { StreamingJobManager } from '@app/unraid-api/streaming-jobs/streaming-job-manager.service.js';

@Module({
    imports: [forwardRef(() => RCloneModule)],
    providers: [
        RCloneApiService,
        BackupSourceService,
        StreamingJobManager,
        ZfsSourceProcessor,
        FlashSourceProcessor,
        ScriptSourceProcessor,
        RawSourceProcessor,
        ZfsValidationService,
        FlashValidationService,
    ],
    exports: [
        BackupSourceService,
        StreamingJobManager,
        ZfsSourceProcessor,
        FlashSourceProcessor,
        ScriptSourceProcessor,
        RawSourceProcessor,
        ZfsValidationService,
        FlashValidationService,
    ],
})
export class BackupSourceModule {}
