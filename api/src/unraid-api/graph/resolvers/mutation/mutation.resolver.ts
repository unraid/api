import { ResolveField, Resolver } from '@nestjs/graphql';

@Resolver('Mutation')
export class MutationResolver {
    @ResolveField()
    public async array() {
        return {
            __typename: 'ArrayMutations',
        };
    }
}
