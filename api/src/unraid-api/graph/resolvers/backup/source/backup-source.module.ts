import { Module } from '@nestjs/common';

import { BackupSourceService } from '@app/unraid-api/graph/resolvers/backup/source/backup-source.service.js';
import { FlashSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-source-processor.service.js';
import { RawSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/raw/raw-source-processor.service.js';
import { ScriptSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/script/script-source-processor.service.js';
import { ZfsSourceProcessor } from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-source-processor.service.js';
import { ZfsValidationService } from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-validation.service.js';

@Module({
    providers: [
        BackupSourceService,
        FlashSourceProcessor,
        RawSourceProcessor,
        ScriptSourceProcessor,
        ZfsSourceProcessor,
        ZfsValidationService,
    ],
    exports: [
        BackupSourceService,
        FlashSourceProcessor,
        RawSourceProcessor,
        ScriptSourceProcessor,
        ZfsSourceProcessor,
        ZfsValidationService,
    ],
})
export class BackupSourceModule {}
