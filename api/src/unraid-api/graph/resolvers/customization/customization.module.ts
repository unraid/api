import { Module } from '@nestjs/common';

import { OnboardingOverrideModule } from '@app/unraid-api/config/onboarding-override.module.js';
import { OnboardingStateModule } from '@app/unraid-api/config/onboarding-state.module.js';
import { OnboardingTrackerModule } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { CustomizationMutationsResolver } from '@app/unraid-api/graph/resolvers/customization/customization.mutations.resolver.js';
import { CustomizationResolver } from '@app/unraid-api/graph/resolvers/customization/customization.resolver.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { InfoModule } from '@app/unraid-api/graph/resolvers/info/info.module.js';

@Module({
    imports: [OnboardingOverrideModule, OnboardingStateModule, OnboardingTrackerModule, InfoModule],
    providers: [OnboardingService, CustomizationResolver, CustomizationMutationsResolver],
    exports: [OnboardingService],
})
export class CustomizationModule {}
