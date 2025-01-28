import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { Resource, type VmDomain } from '@app/graphql/generated/api/types';

@Resolver('Vms')
export class VmsResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    public async vms() {
        console.log('Resolving Domains');
        return {
            id: 'vms',
        };
    }

    @ResolveField('domain')
    public async domain(): Promise<Array<VmDomain>> {
        const { getDomains } = await import('@app/core/modules/vms/get-domains');
        const domains = await getDomains();
        return domains;
    }
}
