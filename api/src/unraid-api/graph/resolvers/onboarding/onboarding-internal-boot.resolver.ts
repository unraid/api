import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { OnboardingInternalBootContext } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.model.js';
import { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';

@Resolver(() => OnboardingInternalBootContext)
export class OnboardingInternalBootResolver {
    constructor(private readonly onboardingInternalBootService: OnboardingInternalBootService) {}

    @Query(() => OnboardingInternalBootContext, {
        description: 'Internal boot setup context used by onboarding',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.WELCOME,
    })
    onboardingInternalBoot(): OnboardingInternalBootContext {
        return this.onboardingInternalBootService.getContext();
    }
}
