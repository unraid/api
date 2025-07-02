import { Module } from '@nestjs/common';

import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';
import { CloudResolver } from '../connection-status/cloud.resolver.js';
import { CloudService } from '../connection-status/cloud.service.js';
import { MothershipHandler } from '../event-handler/mothership.events.js';
import { TimeoutCheckerJob } from '../job/timeout-checker.job.js';
import { MothershipConnectionService } from '../service/connection.service.js';
import { MothershipGraphqlClientService } from '../service/graphql.client.js';
import { InternalClientService } from '../service/internal.client.js';
import { MothershipSubscriptionHandler } from '../service/mothership-subscription.handler.js';
import { RemoteAccessModule } from './remote-access.module.js';

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
