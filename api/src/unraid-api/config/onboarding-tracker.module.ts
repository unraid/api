import { Module } from '@nestjs/common';

import { OnboardingOverrideModule } from '@app/unraid-api/config/onboarding-override.module.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.service.js';

export { OnboardingTrackerService };

@Module({
    imports: [OnboardingOverrideModule],
    providers: [OnboardingTrackerService],
    exports: [OnboardingTrackerService],
})
export class OnboardingTrackerModule {}
