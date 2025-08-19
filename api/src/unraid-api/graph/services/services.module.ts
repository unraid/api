import { Module } from '@nestjs/common';

import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Module({
    providers: [SubscriptionTrackerService, SubscriptionHelperService],
    exports: [SubscriptionTrackerService, SubscriptionHelperService],
})
export class ServicesModule {}
