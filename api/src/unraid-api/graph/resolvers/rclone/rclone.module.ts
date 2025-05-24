import { Module } from '@nestjs/common';

import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';
import { RCloneStatusService } from '@app/unraid-api/graph/resolvers/rclone/rclone-status.service.js';
import { RCloneMutationsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.mutation.resolver.js';
import { RCloneBackupSettingsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.resolver.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { UtilsModule } from '@app/unraid-api/utils/utils.module.js';

@Module({
    imports: [UtilsModule],
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
