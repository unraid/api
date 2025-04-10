import { Mutation, Resolver } from '@nestjs/graphql';

import {
    ArrayMutations,
    DockerMutations,
    RootMutations,
} from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => RootMutations)
export class RootMutationsResolver {
    @Mutation(() => ArrayMutations, { name: 'array' })
    array(): ArrayMutations {
        return new ArrayMutations(); // You can pass context/state here if needed
    }

    @Mutation(() => DockerMutations, { name: 'docker' })
    docker(): DockerMutations {
        return new DockerMutations(); // You can pass context/state here if needed
    }
}
