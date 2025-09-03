import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionManagerService } from '@app/unraid-api/graph/services/subscription-manager.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Module({
    imports: [],
    providers: [SubscriptionTrackerService, SubscriptionHelperService, SubscriptionManagerService],
    exports: [SubscriptionTrackerService, SubscriptionHelperService], // SubscriptionManagerService is internal
})
export class ServicesModule {}
