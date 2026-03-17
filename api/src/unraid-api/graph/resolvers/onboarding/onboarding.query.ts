import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';
import { OnboardingInternalBootContext } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';

@Resolver(() => OnboardingInternalBootContext)
export class OnboardingQueryResolver {
    constructor(private readonly onboardingInternalBootService: OnboardingInternalBootService) {}

    @Query(() => OnboardingInternalBootContext, {
        description: 'Get the latest onboarding context for configuring internal boot',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.WELCOME,
    })
    async internalBootContext(): Promise<OnboardingInternalBootContext> {
        return this.onboardingInternalBootService.getInternalBootContext();
    }
}
