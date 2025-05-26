import { forwardRef, Module } from '@nestjs/common';

import { PreprocessingModule } from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.module.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';
import { RCloneStatusService } from '@app/unraid-api/graph/resolvers/rclone/rclone-status.service.js';
import { RCloneMutationsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.mutation.resolver.js';
import { RCloneBackupSettingsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.resolver.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { UtilsModule } from '@app/unraid-api/utils/utils.module.js';

@Module({
    imports: [UtilsModule, forwardRef(() => PreprocessingModule)],
    providers: [
        RCloneService,
        RCloneApiService,
        RCloneStatusService,
        RCloneFormService,
        RCloneBackupSettingsResolver,
        RCloneMutationsResolver,
    ],
    exports: [RCloneService, RCloneApiService, RCloneStatusService],
})
export class RCloneModule {}
