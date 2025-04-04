import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthZGuard } from 'nest-authz';
import { LoggerModule } from 'nestjs-pino';

import { apiLogger } from '@app/core/log.js';
import { LOG_LEVEL } from '@app/environment.js';
import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { AuthenticationGuard } from '@app/unraid-api/auth/authentication.guard.js';
import { CronModule } from '@app/unraid-api/cron/cron.module.js';
import { GraphModule } from '@app/unraid-api/graph/graph.module.js';
import { PluginModule } from '@app/unraid-api/plugin/plugin.module.js';
import { RestModule } from '@app/unraid-api/rest/rest.module.js';
import { UnraidFileModifierModule } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.module.js';

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                logger: apiLogger,
                autoLogging: false,
                timestamp: false,
                ...(LOG_LEVEL !== 'TRACE'
                    ? {
                          serializers: {
                              req: (req) => ({
                                  id: req.id,
                                  method: req.method,
                                  url: req.url,
                                  remoteAddress: req.remoteAddress,
                              }),
                          },
                      }
                    : {}),
            },
        }),
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
        UnraidFileModifierModule,
        PluginModule.registerPlugins(),
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
