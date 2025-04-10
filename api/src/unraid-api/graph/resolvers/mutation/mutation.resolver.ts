import { Resolver } from '@nestjs/graphql';

import { RootMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

@Resolver(() => RootMutations)
export class RootMutationsResolver {
    constructor() {}
}
