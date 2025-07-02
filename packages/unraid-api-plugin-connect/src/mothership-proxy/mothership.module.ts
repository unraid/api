import { Module } from '@nestjs/common';

import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';
import { CloudResolver } from '../connection-status/cloud.resolver.js';
import { CloudService } from '../connection-status/cloud.service.js';
import { MothershipHandler } from './mothership.events.js';
import { TimeoutCheckerJob } from '../connection-status/timeout-checker.job.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipGraphqlClientService } from './graphql.client.js';
import { InternalClientService } from '../internal-rpc/internal.client.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';
import { RemoteAccessModule } from '../remote-access/remote-access.module.js';

@Module({
    imports: [RemoteAccessModule],
    providers: [
        ConnectApiKeyService,
        MothershipConnectionService,
        MothershipGraphqlClientService,
        InternalClientService,
        MothershipHandler,
        MothershipSubscriptionHandler,
        TimeoutCheckerJob,
        CloudService,
        CloudResolver,
    ],
    exports: [],
})
export class MothershipModule {}
