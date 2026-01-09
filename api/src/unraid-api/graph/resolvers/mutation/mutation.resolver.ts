import { Mutation, Resolver } from '@nestjs/graphql';

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
    @Mutation(() => ArrayMutations, { name: 'array' })
    array(): ArrayMutations {
        return new ArrayMutations();
    }

    @Mutation(() => DockerMutations, { name: 'docker' })
    docker(): DockerMutations {
        return new DockerMutations();
    }

    @Mutation(() => VmMutations, { name: 'vm' })
    vm(): VmMutations {
        return new VmMutations();
    }

    @Mutation(() => ParityCheckMutations, { name: 'parityCheck' })
    parityCheck(): ParityCheckMutations {
        return new ParityCheckMutations();
    }

    @Mutation(() => ApiKeyMutations, { name: 'apiKey' })
    apiKey(): ApiKeyMutations {
        return new ApiKeyMutations();
    }

    @Mutation(() => CustomizationMutations, { name: 'customization' })
    customization(): CustomizationMutations {
        return new CustomizationMutations();
    }

    @Mutation(() => RCloneMutations, { name: 'rclone' })
    rclone(): RCloneMutations {
        return new RCloneMutations();
    }

    @Mutation(() => OnboardingMutations, { name: 'onboarding' })
    onboarding(): OnboardingMutations {
        return new OnboardingMutations();
    }

    @Mutation(() => UnraidPluginsMutations, { name: 'unraidPlugins' })
    unraidPlugins(): UnraidPluginsMutations {
        return new UnraidPluginsMutations();
    }
}
