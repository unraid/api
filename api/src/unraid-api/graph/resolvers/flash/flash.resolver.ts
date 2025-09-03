import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { getters } from '@app/store/index.js';
import { Flash } from '@app/unraid-api/graph/resolvers/flash/flash.model.js';

@Resolver(() => Flash)
export class FlashResolver {
    @Query(() => Flash)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.FLASH,
    })
    public async flash() {
        const emhttp = getters.emhttp();

        return {
            id: 'flash',
            vendor: emhttp.var.flashVendor,
            product: emhttp.var.flashProduct,
        };
    }
}
