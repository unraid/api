import { Module } from '@nestjs/common';

import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';
import { RCloneMutationsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.mutation.resolver.js';
import { RCloneBackupSettingsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.resolver.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';

@Module({
    imports: [],
    providers: [
        RCloneService,
        RCloneApiService,
        RCloneFormService,
        RCloneBackupSettingsResolver,
        RCloneMutationsResolver,
    ],
    exports: [RCloneService, RCloneApiService],
})
export class RCloneModule {}
