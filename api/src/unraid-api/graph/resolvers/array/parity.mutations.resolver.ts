import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';
import { GraphQLJSON } from 'graphql-scalars';

import { ParityService } from '@app/unraid-api/graph/resolvers/array/parity.service.js';
import { ParityCheckMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => ParityCheckMutations)
export class ParityCheckMutationsResolver {
    constructor(private readonly parityService: ParityService) {}

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => GraphQLJSON, { description: 'Start a parity check' })
    async start(@Args('correct') correct: boolean): Promise<object> {
        return this.parityService.updateParityCheck({
            wantedState: 'start',
            correct,
        });
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => GraphQLJSON, { description: 'Pause a parity check' })
    async pause(): Promise<object> {
        return this.parityService.updateParityCheck({
            wantedState: 'pause',
            correct: false,
        });
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => GraphQLJSON, { description: 'Resume a parity check' })
    async resume(): Promise<object> {
        return this.parityService.updateParityCheck({
            wantedState: 'resume',
            correct: false,
        });
    }

    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.ARRAY,
        possession: AuthPossession.ANY,
    })
    @ResolveField(() => GraphQLJSON, { description: 'Cancel a parity check' })
    async cancel(): Promise<object> {
        return this.parityService.updateParityCheck({
            wantedState: 'cancel',
            correct: false,
        });
    }
}
