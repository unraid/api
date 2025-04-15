import { Module } from '@nestjs/common';

import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';
import { RCloneBackupSettingsResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone.resolver.js';
import { RCloneConfigResolver } from '@app/unraid-api/graph/resolvers/rclone/rclone-config.resolver.js';

@Module({
    imports: [],    
    providers: [
        RCloneService, 
        RCloneApiService, 
        RCloneFormService,
        RCloneBackupSettingsResolver,
        RCloneConfigResolver
    ],
    exports: [RCloneService, RCloneApiService]
})
export class RCloneModule {}
