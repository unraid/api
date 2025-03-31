import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { VmDomain } from '@app/graphql/generated/api/types.js';
import { Resource } from '@app/graphql/generated/api/types.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

@Resolver('Vms')
export class VmsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @Query()
    public async vms() {
        return {
            id: 'vms',
        };
    }

    @ResolveField('domain')
    public async domain(): Promise<Array<VmDomain>> {
        try {
            return await this.vmsService.getDomains();
        } catch (error) {
            // Consider using a proper logger here
            throw new Error(
                `Failed to retrieve VM domains: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
