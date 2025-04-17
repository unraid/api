import { Module } from '@nestjs/common';

import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';
import { RCloneBackupSettingsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.resolver.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';

@Module({
    imports: [],
    providers: [RCloneService, RCloneApiService, RCloneFormService, RCloneBackupSettingsResolver],
    exports: [RCloneService, RCloneApiService],
})
export class RCloneModule {}
