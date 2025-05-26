import { forwardRef, Module } from '@nestjs/common';

import { FlashPreprocessingService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/flash-preprocessing.service.js';
import { FlashValidationService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/flash-validation.service.js';
import { PreprocessConfigValidationService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing-validation.service.js';
import { PreprocessingService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.service.js';
import { ScriptPreprocessingService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/script-preprocessing.service.js';
import { StreamingJobManager } from '@app/unraid-api/graph/resolvers/backup/preprocessing/streaming-job-manager.service.js';
import { ZfsPreprocessingService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/zfs-preprocessing.service.js';
import { ZfsValidationService } from '@app/unraid-api/graph/resolvers/backup/preprocessing/zfs-validation.service.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';

@Module({
    imports: [forwardRef(() => RCloneModule)],
    providers: [
        RCloneApiService,
        PreprocessingService,
        PreprocessConfigValidationService,
        StreamingJobManager,
        ZfsPreprocessingService,
        FlashPreprocessingService,
        ScriptPreprocessingService,
        ZfsValidationService,
        FlashValidationService,
    ],
    exports: [
        PreprocessingService,
        PreprocessConfigValidationService,
        StreamingJobManager,
        ZfsPreprocessingService,
        FlashPreprocessingService,
        ScriptPreprocessingService,
        ZfsValidationService,
        FlashValidationService,
    ],
})
export class PreprocessingModule {}
