import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthZGuard } from 'nest-authz';
import { LoggerModule } from 'nestjs-pino';

import { apiLogger } from '@app/core/log';
import { GraphqlAuthGuard } from '@app/unraid-api/auth/auth.guard';
import { AuthModule } from '@app/unraid-api/auth/auth.module';
import { CronModule } from '@app/unraid-api/cron/cron.module';
import { GraphModule } from '@app/unraid-api/graph/graph.module';
import { RestModule } from '@app/unraid-api/rest/rest.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                logger: apiLogger,
                autoLogging: false,
            },
        }),
        CacheModule.register(),
        AuthModule,
        CronModule,
        GraphModule,
        RestModule,
        ThrottlerModule.forRoot([
            {
                ttl: 10000, // 10 seconds
                limit: 100, // 100 requests per 10 seconds
            },
        ]),
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: GraphqlAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AuthZGuard,
        },
    ],
})
export class AppModule {}
