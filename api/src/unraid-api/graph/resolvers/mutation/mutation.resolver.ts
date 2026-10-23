import { Mutation, Resolver } from '@nestjs/graphql';

import { Authenticated } from '@app/unraid-api/auth/authenticated.decorator.js';
import {
    ApiKeyMutations,
    ArrayMutations,
    CustomizationMutations,
    DockerMutations,
    OnboardingMutations,
    ParityCheckMutations,
    RCloneMutations,
    RootMutations,
    UnraidPluginsMutations,
    VmMutations,
} from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => RootMutations)
export class RootMutationsResolver {
    @Authenticated()
    @Mutation(() => ArrayMutations, { name: 'array' })
    array(): ArrayMutations {
        return new ArrayMutations();
    }

    @Authenticated()
    @Mutation(() => DockerMutations, { name: 'docker' })
    docker(): DockerMutations {
        return new DockerMutations();
    }

    @Authenticated()
    @Mutation(() => VmMutations, { name: 'vm' })
    vm(): VmMutations {
        return new VmMutations();
    }

    @Authenticated()
    @Mutation(() => ParityCheckMutations, { name: 'parityCheck' })
    parityCheck(): ParityCheckMutations {
        return new ParityCheckMutations();
    }

    @Authenticated()
    @Mutation(() => ApiKeyMutations, { name: 'apiKey' })
    apiKey(): ApiKeyMutations {
        return new ApiKeyMutations();
    }

    @Authenticated()
    @Mutation(() => CustomizationMutations, { name: 'customization' })
    customization(): CustomizationMutations {
        return new CustomizationMutations();
    }

    @Authenticated()
    @Mutation(() => RCloneMutations, { name: 'rclone' })
    rclone(): RCloneMutations {
        return new RCloneMutations();
    }

    @Authenticated()
    @Mutation(() => OnboardingMutations, { name: 'onboarding' })
    onboarding(): OnboardingMutations {
        return new OnboardingMutations();
    }

    @Authenticated()
    @Mutation(() => UnraidPluginsMutations, { name: 'unraidPlugins' })
    unraidPlugins(): UnraidPluginsMutations {
        return new UnraidPluginsMutations();
    }
}
