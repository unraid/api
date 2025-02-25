import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { LogRotateService } from '@app/unraid-api/cron/log-rotate.service.js';
import { WriteFlashFileService } from '@app/unraid-api/cron/write-flash-file.service.js';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [WriteFlashFileService, LogRotateService],
})
export class CronModule {}
