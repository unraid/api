import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { LoggerModule } from 'nestjs-pino';

import { apiLogger } from '@app/core/log';
import { AuthModule } from '@app/unraid-api/auth/auth.module';
import { CronModule } from '@app/unraid-api/cron/cron.module';
import { GraphModule } from '@app/unraid-api/graph/graph.module';
import { RestModule } from '@app/unraid-api/rest/rest.module';

import { FastifyThrottlerGuard } from '../auth/fastify-throttler.guard';

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                logger: apiLogger,
                autoLogging: false,
            },
        }),
        AuthModule,
        CronModule,
        GraphModule,
        RestModule,
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: FastifyThrottlerGuard,
        },
    ],
})
export class AppModule {}
