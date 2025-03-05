import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { VmDomain } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';

@Resolver('Vms')
export class VmsResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.VMS,
        possession: AuthPossession.ANY,
    })
    public async vms() {
        return {
            id: 'vms',
        };
    }

    @ResolveField('domain')
    public async domain(): Promise<Array<VmDomain>> {
        try {
            const { getDomains } = await import('@app/core/modules/vms/get-domains.js');
            const domains = await getDomains();
            return domains;
        } catch (error) {
            // Consider using a proper logger here
            throw new Error(
                `Failed to retrieve VM domains: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
