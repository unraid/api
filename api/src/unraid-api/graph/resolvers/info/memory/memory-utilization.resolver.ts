import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { GraphQLBigInt } from 'graphql-scalars';

import { MemoryBreakdownService } from '@app/unraid-api/graph/resolvers/info/memory/memory-breakdown.service.js';
import { MemoryUtilization } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';

@Resolver(() => MemoryUtilization)
export class MemoryUtilizationResolver {
    constructor(private readonly breakdown: MemoryBreakdownService) {}

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'zfsCache' })
    async zfsCache(): Promise<number | null> {
        return (await this.breakdown.getSources()).zfsCache;
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'vm' })
    async vm(): Promise<number | null> {
        return (await this.breakdown.getSources()).vm;
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'docker' })
    async docker(): Promise<number | null> {
        return (await this.breakdown.getSources()).docker;
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'system' })
    async system(@Parent() memory: MemoryUtilization): Promise<number> {
        const { zfsCache, vm, docker } = await this.breakdown.getSources();
        const used = memory.total - memory.available;
        const categorized = (vm ?? 0) + (zfsCache ?? 0) + (docker ?? 0);
        return Math.max(0, used - categorized);
    }
}
