import { ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { ServerPowerMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { ServerPowerService } from '@app/unraid-api/graph/resolvers/server-power/server-power.service.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => ServerPowerMutations)
export class ServerPowerMutationsResolver {
    constructor(private readonly serverPowerService: ServerPowerService) {}

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    @ResolveField(() => Boolean, { description: 'Reboot the server' })
    async reboot(): Promise<boolean> {
        return this.serverPowerService.reboot();
    }

    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    @ResolveField(() => Boolean, { description: 'Shut down the server' })
    async shutdown(): Promise<boolean> {
        return this.serverPowerService.shutdown();
    }
}
