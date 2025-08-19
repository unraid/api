import { OnModuleInit } from '@nestjs/common';
import { ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { CachedResolverBase } from '@app/unraid-api/graph/resolvers/base/cached-resolver.base.js';
import {
    InfoMemory,
    MemoryLayout,
    MemoryUtilization,
} from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Resolver(() => InfoMemory)
export class InfoMemoryResolver extends CachedResolverBase<InfoMemory> implements OnModuleInit {
    private memoryPollingTimer: NodeJS.Timeout | undefined;
    private isMemoryPollingInProgress = false;

    constructor(
        private readonly memoryService: MemoryService,
        private readonly subscriptionTracker: SubscriptionTrackerService,
        private readonly subscriptionHelper: SubscriptionHelperService
    ) {
        super();
    }

    onModuleInit() {
        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.MEMORY_UTILIZATION,
            () => {
                this.pollMemoryUtilization();
                this.memoryPollingTimer = setInterval(() => this.pollMemoryUtilization(), 2000);
            },
            () => {
                clearInterval(this.memoryPollingTimer);
                this.isMemoryPollingInProgress = false;
            }
        );
    }

    private async pollMemoryUtilization(): Promise<void> {
        if (this.isMemoryPollingInProgress) return;

        this.isMemoryPollingInProgress = true;
        try {
            const payload = await this.memoryService.generateMemoryLoad();
            pubsub.publish(PUBSUB_CHANNEL.MEMORY_UTILIZATION, { systemMetricsMemory: payload });
        } catch (error) {
            console.error('Error polling memory utilization:', error);
        } finally {
            this.isMemoryPollingInProgress = false;
        }
    }

    // Implementation of abstract methods from CachedResolverBase
    protected getPromiseCacheKey(): string {
        return '_memoryPromise';
    }

    protected hasData(parent: Partial<InfoMemory>): boolean {
        // Check if we have memory-specific data
        return parent.layout !== undefined;
    }

    protected fetchData(): Promise<InfoMemory> {
        return this.memoryService.generateMemory();
    }

    @ResolveField(() => [MemoryLayout])
    public async layout(parent: Partial<InfoMemory>): Promise<MemoryLayout[]> {
        const memory = await this.getCachedData(parent);
        return memory.layout;
    }

    @ResolveField(() => MemoryUtilization, {
        description: 'Current memory utilization',
        nullable: true,
    })
    public async utilization(): Promise<MemoryUtilization> {
        return this.memoryService.generateMemoryLoad();
    }

    @Subscription(() => MemoryUtilization, {
        name: 'systemMetricsMemory',
        resolve: (value) => value.systemMetricsMemory,
    })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async systemMetricsMemorySubscription() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.MEMORY_UTILIZATION);
    }
}
