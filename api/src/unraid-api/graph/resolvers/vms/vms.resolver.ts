import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { VmDomain, Vms } from '@app/unraid-api/graph/resolvers/vms/vms.model.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

@Resolver(() => Vms)
export class VmsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @Query(() => Vms)
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
        try {
            return await this.vmsService.getDomains();
        } catch (error) {
            throw new Error(
                `Failed to retrieve VM domains: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
