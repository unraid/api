import { Module } from '@nestjs/common';

import { OnboardingOverrideModule } from '@app/unraid-api/config/onboarding-override.module.js';
import { OnboardingStateModule } from '@app/unraid-api/config/onboarding-state.module.js';
import {
    OnboardingTrackerService,
    UPGRADE_MARKER_PATH,
} from '@app/unraid-api/config/onboarding-tracker.service.js';

export { OnboardingTrackerService, UPGRADE_MARKER_PATH };

@Module({
    imports: [OnboardingOverrideModule, OnboardingStateModule],
    providers: [OnboardingTrackerService],
    exports: [OnboardingTrackerService],
})
export class OnboardingTrackerModule {}
