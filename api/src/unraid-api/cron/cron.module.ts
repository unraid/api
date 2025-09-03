import { Module } from '@nestjs/common';

import { JobModule } from '@app/unraid-api/cron/job.module.js';
import { LogRotateService } from '@app/unraid-api/cron/log-rotate.service.js';
import { WriteFlashFileService } from '@app/unraid-api/cron/write-flash-file.service.js';

@Module({
    imports: [JobModule],
    providers: [WriteFlashFileService, LogRotateService],
})
export class CronModule {}
