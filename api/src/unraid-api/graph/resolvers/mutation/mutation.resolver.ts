import { Mutation, Resolver } from '@nestjs/graphql';

import { Mutation as MutationType } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => MutationType)
export class MutationResolver {
    @Mutation(() => MutationType)
    mutation(): MutationType {
        return new MutationType();
    }
}
