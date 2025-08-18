import { Module } from '@nestjs/common';

import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Module({
    providers: [SubscriptionTrackerService],
    exports: [SubscriptionTrackerService],
})
export class ServicesModule {}
