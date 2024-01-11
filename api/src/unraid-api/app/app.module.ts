import { apiLogger } from '@app/core/log';
import { setupPermissions } from '@app/core/permissions';
import { GraphqlAuthGuard } from '@app/unraid-api/auth/auth.guard';
import { AuthModule } from '@app/unraid-api/auth/auth.module';
import { GraphModule } from '@app/unraid-api/graph/graph.module';
import { RestModule } from '@app/unraid-api/rest/rest.module';
import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACGuard, AccessControlModule } from 'nest-access-control';
import { LoggerModule } from 'nestjs-pino';
import { CronModule } from '@app/unraid-api/cron/cron.module';

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                logger: apiLogger,
                autoLogging: false,
            },
        }),
        AccessControlModule.forRoles(setupPermissions()),
        AuthModule,
        CronModule,
        GraphModule,
        RestModule,
    ],
    controllers: [],
    providers: [
        {
            provide: 'APP_GUARD',
            useFactory: () => new GraphqlAuthGuard(new Reflector()),
        },
        {
            provide: 'APP_GUARD',
            useClass: ACGuard,
        },
    ],
})
export class AppModule {}
