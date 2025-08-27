import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { getters } from '@app/store/index.js';
import { Config } from '@app/unraid-api/graph/resolvers/config/config.model.js';

@Resolver(() => Config)
export class ConfigResolver {
    @Query(() => Config)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    public async config(): Promise<Config> {
        const emhttp = getters.emhttp();
        return {
            id: 'config',
            valid: emhttp.var.configValid,
            error: emhttp.var.configValid ? null : emhttp.var.configErrorState,
        };
    }
}
