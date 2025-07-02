import { Module } from '@nestjs/common';

import { MothershipHandler } from '../event-handler/mothership.events.js';
import { TimeoutCheckerJob } from '../job/timeout-checker.job.js';
import { CloudResolver } from '../resolver/cloud.resolver.js';
import { CloudService } from '../service/cloud.service.js';
import { ConnectApiKeyService } from '../service/connect-api-key.service.js';
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
