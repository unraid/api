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
import { CpuUtilization, InfoCpu } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Resolver(() => InfoCpu)
export class InfoCpuResolver extends CachedResolverBase<InfoCpu> implements OnModuleInit {
    private cpuPollingTimer: NodeJS.Timeout | undefined;
    private isCpuPollingInProgress = false;

    constructor(
        private readonly cpuService: CpuService,
        private readonly subscriptionTracker: SubscriptionTrackerService,
        private readonly subscriptionHelper: SubscriptionHelperService
    ) {
        super();
    }

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

    // Implementation of abstract methods from CachedResolverBase
    protected getPromiseCacheKey(): string {
        return '_cpuPromise';
    }

    protected hasData(parent: Partial<InfoCpu>): boolean {
        // Check if we have CPU-specific data
        return parent.manufacturer !== undefined;
    }

    protected fetchData(): Promise<InfoCpu> {
        return this.cpuService.generateCpu();
    }

    // ResolveFields for InfoCpu properties
    @ResolveField(() => String, { nullable: true })
    public async manufacturer(parent: Partial<InfoCpu>): Promise<string | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.manufacturer;
    }

    @ResolveField(() => String, { nullable: true })
    public async brand(parent: Partial<InfoCpu>): Promise<string | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.brand;
    }

    @ResolveField(() => String, { nullable: true })
    public async vendor(parent: Partial<InfoCpu>): Promise<string | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.vendor;
    }

    @ResolveField(() => String, { nullable: true })
    public async family(parent: Partial<InfoCpu>): Promise<string | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.family;
    }

    @ResolveField(() => String, { nullable: true })
    public async model(parent: Partial<InfoCpu>): Promise<string | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.model;
    }

    @ResolveField(() => Number, { nullable: true })
    public async stepping(parent: Partial<InfoCpu>): Promise<number | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.stepping;
    }

    @ResolveField(() => Number, { nullable: true })
    public async cores(parent: Partial<InfoCpu>): Promise<number | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.cores;
    }

    @ResolveField(() => Number, { nullable: true })
    public async threads(parent: Partial<InfoCpu>): Promise<number | undefined> {
        const cpu = await this.getCachedData(parent);
        return cpu.threads;
    }

    @ResolveField(() => CpuUtilization, {
        description: 'Current CPU utilization',
        nullable: true,
    })
    public async utilization(): Promise<CpuUtilization> {
        return this.cpuService.generateCpuLoad();
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
}
