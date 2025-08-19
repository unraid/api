import { OnModuleInit } from '@nestjs/common';
import { Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { CpuUtilization } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryUtilization } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { Metrics } from '@app/unraid-api/graph/resolvers/metrics/metrics.model.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Resolver(() => Metrics)
export class MetricsResolver implements OnModuleInit {
    private cpuPollingTimer: NodeJS.Timeout | undefined;
    private memoryPollingTimer: NodeJS.Timeout | undefined;
    private isCpuPollingInProgress = false;
    private isMemoryPollingInProgress = false;

    constructor(
        private readonly cpuService: CpuService,
        private readonly memoryService: MemoryService,
        private readonly subscriptionTracker: SubscriptionTrackerService,
        private readonly subscriptionHelper: SubscriptionHelperService
    ) {}

    onModuleInit() {
        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.CPU_UTILIZATION,
            () => {
                this.pollCpuUtilization();
                this.cpuPollingTimer = setInterval(() => this.pollCpuUtilization(), 1000);
            },
            () => {
                clearInterval(this.cpuPollingTimer);
                this.isCpuPollingInProgress = false;
            }
        );

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

    private async pollCpuUtilization(): Promise<void> {
        if (this.isCpuPollingInProgress) return;

        this.isCpuPollingInProgress = true;
        try {
            const payload = await this.cpuService.generateCpuLoad();
            pubsub.publish(PUBSUB_CHANNEL.CPU_UTILIZATION, { systemMetricsCpu: payload });
        } catch (error) {
            console.error('Error polling CPU utilization:', error);
        } finally {
            this.isCpuPollingInProgress = false;
        }
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

    @Query(() => Metrics)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async metrics(): Promise<Partial<Metrics>> {
        return {
            id: 'metrics',
        };
    }

    @ResolveField(() => CpuUtilization, { nullable: true })
    public async cpu(): Promise<CpuUtilization> {
        return this.cpuService.generateCpuLoad();
    }

    @ResolveField(() => MemoryUtilization, { nullable: true })
    public async memory(): Promise<MemoryUtilization> {
        return this.memoryService.generateMemoryLoad();
    }

    @Subscription(() => CpuUtilization, {
        name: 'systemMetricsCpu',
        resolve: (value) => value.systemMetricsCpu,
    })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async systemMetricsCpuSubscription() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.CPU_UTILIZATION);
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
