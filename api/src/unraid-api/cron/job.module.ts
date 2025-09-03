import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * Sets up common dependencies for initializing jobs (e.g. scheduler registry, cron jobs).
 *
 * Simplifies testing setup & application dependency tree by ensuring `forRoot` is called only once.
 */
@Module({
    imports: [ScheduleModule.forRoot()],
})
export class JobModule {}
