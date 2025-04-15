import { Module } from '@nestjs/common';

import { FlashBackupResolver } from './flash-backup.resolver.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';

@Module({
    imports: [RCloneModule],
    providers: [FlashBackupResolver],
    exports: [],
})
export class FlashBackupModule {}
