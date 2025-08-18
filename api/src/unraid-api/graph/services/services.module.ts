import { Module } from '@nestjs/common';
import { SubscriptionTrackerService } from './subscription-tracker.service';

@Module({
    providers: [SubscriptionTrackerService],
    exports: [SubscriptionTrackerService],
})
export class ServicesModule {}
