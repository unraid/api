import { Module } from '@nestjs/common';
import { LogsResolver } from './logs.resolver.js';
import { LogsService } from './logs.service.js';

@Module({
  providers: [LogsResolver, LogsService],
  exports: [LogsService],
})
export class LogsModule {} 