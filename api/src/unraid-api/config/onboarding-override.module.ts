import { Module } from '@nestjs/common';

import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';

@Module({
    providers: [OnboardingOverrideService],
    exports: [OnboardingOverrideService],
})
export class OnboardingOverrideModule {}
