import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MemoryBreakdownSources } from '@app/unraid-api/graph/resolvers/info/memory/memory-breakdown.service.js';
import { MemoryBreakdownService } from '@app/unraid-api/graph/resolvers/info/memory/memory-breakdown.service.js';
import { MemoryUtilizationResolver } from '@app/unraid-api/graph/resolvers/info/memory/memory-utilization.resolver.js';
import { MemoryUtilization } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';

const parent = (total: number, available: number) => ({ total, available }) as MemoryUtilization;

const resolverWithSources = (sources: MemoryBreakdownSources) => {
    const breakdown = {
        getSources: vi.fn().mockResolvedValue(sources),
    } as unknown as MemoryBreakdownService;
    return new MemoryUtilizationResolver(breakdown);
};

describe('MemoryUtilizationResolver', () => {
    describe('source passthrough', () => {
        let resolver: MemoryUtilizationResolver;

        beforeEach(() => {
            resolver = resolverWithSources({ zfsCache: 1, vm: 2, docker: 3 });
        });

        it('returns each collected source', async () => {
            await expect(resolver.zfsCache()).resolves.toBe(1);
            await expect(resolver.vm()).resolves.toBe(2);
            await expect(resolver.docker()).resolves.toBe(3);
        });
    });

    describe('system', () => {
        it('is used (total - available) minus the categorized sources', async () => {
            const resolver = resolverWithSources({ zfsCache: 1_000, vm: 2_000, docker: 3_000 });
            const result = await resolver.system(parent(20_000, 4_000));
            expect(result).toBe(10_000);
        });

        it('treats null sources as zero', async () => {
            const resolver = resolverWithSources({ zfsCache: null, vm: null, docker: 500 });
            const result = await resolver.system(parent(10_000, 4_000));
            expect(result).toBe(5_500);
        });

        it('clamps to zero when categorized memory exceeds used', async () => {
            const resolver = resolverWithSources({ zfsCache: 5_000, vm: 5_000, docker: 5_000 });
            const result = await resolver.system(parent(10_000, 4_000));
            expect(result).toBe(0);
        });
    });
});
