import { apiLogger } from '@app/core/log';
import { AuthModule } from '@app/unraid-api/auth/auth.module';
import { GraphModule } from '@app/unraid-api/graph/graph.module';
import { RestModule } from '@app/unraid-api/rest/rest.module';
import { Module } from '@nestjs/common';
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
        AuthModule,
        CronModule,
        GraphModule,
        RestModule,
    ],
    controllers: [],
    providers: [
        
    ],
})
export class AppModule {}
