import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getDomains } from '@app/core/modules/vms/get-domains';
import { Resource } from '@app/graphql/generated/api/types';

@Resolver()
export class VmsResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    public async vms() {
        return {};
    }

    @Resolver('domain')
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: 'vms/domain',
        possession: AuthPossession.ANY,
    })
    public async domain() {
        return getDomains();
    }
}
