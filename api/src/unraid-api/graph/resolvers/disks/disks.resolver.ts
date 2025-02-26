import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getDisks } from '@app/core/modules/get-disks.js';
import { Resource } from '@app/graphql/generated/api/types.js';

@Resolver('Disks')
export class DisksResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.DISK,
        possession: AuthPossession.ANY,
    })
    public async disks() {
        const disks = await getDisks({
            temperature: true,
        });
        return disks;
    }
}
