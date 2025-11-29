import { Module } from '@nestjs/common';


import { CloudResolver } from '../connection-status/cloud.resolver.js';
import { CloudService } from '../connection-status/cloud.service.js';
import { ConnectStatusWriterService } from '../connection-status/connect-status-writer.service.js';
import { TimeoutCheckerJob } from '../connection-status/timeout-checker.job.js';
import { RemoteAccessModule } from '../remote-access/remote-access.module.js';
import { MothershipConnectionService } from './connection.service.js';
import { LocalGraphQLExecutor } from './local-graphql-executor.service.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';
import { MothershipController } from './mothership.controller.js';
import { MothershipHandler } from './mothership.events.js';
import { UnraidServerClientService } from './unraid-server-client.service.js';
import { MothershipGraphqlClientService } from './graphql.client.js';

@Module({
    imports: [RemoteAccessModule],
    providers: [
        ConnectStatusWriterService,
        MothershipConnectionService,
        MothershipGraphqlClientService,
        MothershipHandler,
        MothershipSubscriptionHandler,
        TimeoutCheckerJob,
        CloudService,
        CloudResolver,
        MothershipController,
    ],
    exports: [],
})
export class MothershipModule {}
