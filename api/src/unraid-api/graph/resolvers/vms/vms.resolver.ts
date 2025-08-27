import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { VmDomain, Vms } from '@app/unraid-api/graph/resolvers/vms/vms.model.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

@Resolver(() => Vms)
export class VmsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @Query(() => Vms, { description: 'Get information about all VMs on the system' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.VMS,
    })
    public async vms() {
        return {
            id: 'vms',
        };
    }

    @ResolveField(() => [VmDomain])
    public async domains(): Promise<Array<VmDomain>> {
        try {
            return await this.vmsService.getDomains();
        } catch (error) {
            throw new Error(
                `Failed to retrieve VM domains: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    @ResolveField(() => [VmDomain])
    public async domain(): Promise<Array<VmDomain>> {
        return this.domains();
    }
}
