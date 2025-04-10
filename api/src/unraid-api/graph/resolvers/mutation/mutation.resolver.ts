import { Resolver, Mutation } from '@nestjs/graphql';
import { Mutation as MutationType } from './mutation.model.js';

@Resolver(() => MutationType)
export class MutationResolver {
    @Mutation(() => MutationType)
    mutation(): MutationType {
        return new MutationType();
    }
}
