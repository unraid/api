import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionPollingService } from '@app/unraid-api/graph/services/subscription-polling.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [SubscriptionTrackerService, SubscriptionHelperService, SubscriptionPollingService],
    exports: [SubscriptionTrackerService, SubscriptionHelperService, SubscriptionPollingService],
})
export class ServicesModule {}
