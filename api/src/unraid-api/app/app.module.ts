import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthZGuard } from 'nest-authz';
import { LoggerModule } from 'nestjs-pino';

import { apiLogger } from '@app/core/log.js';
import { LOG_LEVEL } from '@app/environment.js';
import { AppI18nModule } from '@app/i18n/i18n.module.js';
import { PubSubModule } from '@app/unraid-api/app/pubsub.module.js';
import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { AuthenticationGuard } from '@app/unraid-api/auth/authentication.guard.js';
import { LegacyConfigModule } from '@app/unraid-api/config/legacy-config.module.js';
import { CronModule } from '@app/unraid-api/cron/cron.module.js';
import { GraphModule } from '@app/unraid-api/graph/graph.module.js';
import { GlobalDepsModule } from '@app/unraid-api/plugin/global-deps.module.js';
import { RestModule } from '@app/unraid-api/rest/rest.module.js';
import { UnraidFileModifierModule } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.module.js';

@Module({
    imports: [
        GlobalDepsModule,
        LegacyConfigModule,
        AppI18nModule,
        PubSubModule,
        ScheduleModule.forRoot(),
        LoggerModule.forRoot({
            pinoHttp: {
                logger: apiLogger,
                autoLogging: false,
                timestamp: false,
                serializers: {
                    req: () => undefined,
                    res: () => undefined,
                },
                formatters: {
                    log: (obj) => {
                        // Map NestJS context to Pino context field for pino-pretty
                        if (obj.context && !obj.logger) {
                            return { ...obj, logger: obj.context };
                        }
                        return obj;
                    },
                },
            },
        }),
        AuthModule,
        CronModule,
        CacheModule.register({ isGlobal: true }),
        GraphModule,
        RestModule,
        ThrottlerModule.forRoot([
            {
                ttl: 10000, // 10 seconds
                limit: 100, // 100 requests per 10 seconds
            },
        ]),
        UnraidFileModifierModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthenticationGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AuthZGuard,
        },
    ],
})
export class AppModule {}
