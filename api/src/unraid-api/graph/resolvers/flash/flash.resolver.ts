import { Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';

import { getters } from '@app/store/index.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Flash } from '@app/unraid-api/graph/resolvers/flash/flash.model.js';

@Resolver(() => Flash)
export class FlashResolver {
    @Query(() => Flash)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.FLASH,
        possession: AuthPossession.ANY,
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
