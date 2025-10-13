import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { OnboardingTracker } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { buildUpgradeInfoFromSnapshot } from '@app/unraid-api/graph/resolvers/info/versions/upgrade-info.util.js';
import { UpgradeInfo } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';
import { OnboardingMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { CompleteUpgradeStepInput } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';

@Resolver(() => OnboardingMutations)
export class OnboardingMutationsResolver {
    constructor(private readonly onboardingTracker: OnboardingTracker) {}

    @ResolveField(() => UpgradeInfo, {
        description: 'Marks an upgrade onboarding step as completed for the current OS version',
    })
    async completeUpgradeStep(@Args('input') input: CompleteUpgradeStepInput): Promise<UpgradeInfo> {
        const snapshot = await this.onboardingTracker.markStepCompleted(input.stepId);
        return buildUpgradeInfoFromSnapshot(snapshot);
    }
}
