import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { getters } from '@app/store/index.js';
import { UpdateSshInput, Vars } from '@app/unraid-api/graph/resolvers/vars/vars.model.js';
import { VarsService } from '@app/unraid-api/graph/resolvers/vars/vars.service.js';

@Resolver(() => Vars)
export class VarsResolver {
    constructor(private readonly varsService: VarsService) {}

    @Query(() => Vars)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.VARS,
    })
    public async vars() {
        return {
            id: 'vars',
            ...(getters.emhttp().var ?? {}),
        };
    }

    @Mutation(() => Vars)
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VARS,
    })
    public async updateSshSettings(@Args('input') input: UpdateSshInput) {
        return this.varsService.updateSshSettings(input.enabled, input.port);
    }
}
