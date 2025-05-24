import { Mutation, Resolver } from '@nestjs/graphql';

import {
    ApiKeyMutations,
    ArrayMutations,
    DockerMutations,
    ParityCheckMutations,
    RCloneMutations,
    RootMutations,
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

    @Mutation(() => RCloneMutations, { name: 'rclone' })
    rclone(): RCloneMutations {
        return new RCloneMutations();
    }
}
