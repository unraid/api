import { Module } from '@nestjs/common';

import { RemoteAccessModule } from '../remote-access/remote-access.module.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipGraphqlClientService } from './graphql.client.js';
import { InternalClientService } from './internal.client.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';
import { MothershipHandler } from './mothership.handler.js';
import { TimeoutCheckerJob } from './timeout-checker.job.js';

@Module({
    imports: [RemoteAccessModule],
    providers: [
        MothershipConnectionService,
        MothershipGraphqlClientService,
        InternalClientService,
        MothershipHandler,
        MothershipSubscriptionHandler,
        TimeoutCheckerJob,
    ],
    exports: [],
})
export class MothershipModule {}
