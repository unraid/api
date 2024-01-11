import { LogCleanupService } from '@app/unraid-api/cron/log-cleanup.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [LogCleanupService],
})
export class CronModule {}
