import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource } from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';

@Resolver()
export class FlashResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.FLASH,
        possession: AuthPossession.OWN,
    })
    public async flash() {
        const emhttp = getters.emhttp();

        return {
            guid: emhttp.var.flashGuid,
            vendor: emhttp.var.flashVendor,
            product: emhttp.var.flashProduct,
        };
    }
}
