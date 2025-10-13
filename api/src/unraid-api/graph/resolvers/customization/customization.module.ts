import { Module } from '@nestjs/common';

import { OnboardingTrackerModule } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { CustomizationMutationsResolver } from '@app/unraid-api/graph/resolvers/customization/customization.mutations.resolver.js';
import { CustomizationResolver } from '@app/unraid-api/graph/resolvers/customization/customization.resolver.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';

@Module({
    imports: [OnboardingTrackerModule],
    providers: [OnboardingService, CustomizationResolver, CustomizationMutationsResolver],
    exports: [OnboardingService],
})
export class CustomizationModule {}
