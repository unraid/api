import { LogCleanupService } from '@app/unraid-api/cron/log-cleanup.service';
import { WriteFlashFileService } from '@app/unraid-api/cron/write-flash-file.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [LogCleanupService, WriteFlashFileService],
})
export class CronModule {}
