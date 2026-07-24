import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { GraphQLBigInt } from 'graphql-scalars';

import { MemoryBreakdownService } from '@app/unraid-api/graph/resolvers/info/memory/memory-breakdown.service.js';
import { MemoryUtilization } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';

@Resolver(() => MemoryUtilization)
export class MemoryUtilizationResolver {
    constructor(private readonly breakdown: MemoryBreakdownService) {}

    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'zfsCache' })
    async zfsCache(): Promise<number | null> {
        return (await this.breakdown.getSources()).zfsCache;
    }

    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'vm' })
    async vm(): Promise<number | null> {
        return (await this.breakdown.getSources()).vm;
    }

    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'docker' })
    async docker(): Promise<number | null> {
        return (await this.breakdown.getSources()).docker;
    }

    @ResolveField(() => GraphQLBigInt, { nullable: true, name: 'system' })
    async system(@Parent() memory: MemoryUtilization): Promise<number> {
        const { zfsCache, vm, docker } = await this.breakdown.getSources();
        const used = memory.total - memory.available;
        const categorized = (vm ?? 0) + (zfsCache ?? 0) + (docker ?? 0);
        return Math.max(0, used - categorized);
    }
}
