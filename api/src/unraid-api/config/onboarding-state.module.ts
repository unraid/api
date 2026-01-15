import { Module } from '@nestjs/common';

import { OnboardingOverrideModule } from '@app/unraid-api/config/onboarding-override.module.js';
import { OnboardingStateService } from '@app/unraid-api/config/onboarding-state.service.js';

@Module({
    imports: [OnboardingOverrideModule],
    providers: [OnboardingStateService],
    exports: [OnboardingStateService],
})
export class OnboardingStateModule {}
