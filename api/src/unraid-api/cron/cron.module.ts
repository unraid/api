import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { LogRotateService } from '@app/unraid-api/cron/log-rotate.service';
import { WriteFlashFileService } from '@app/unraid-api/cron/write-flash-file.service';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [WriteFlashFileService, LogRotateService],
})
export class CronModule {}
