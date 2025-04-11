import { Query, Resolver } from '@nestjs/graphql';

import { getters } from '@app/store/index.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { Config } from '@app/unraid-api/graph/resolvers/config/config.model.js';

@Resolver(() => Config)
export class ConfigResolver {
    @Query(() => Config)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
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
