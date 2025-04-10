import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getters } from '@app/store/index.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
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
            guid: emhttp.var.flashGuid,
            vendor: emhttp.var.flashVendor,
            product: emhttp.var.flashProduct,
        };
    }
}
