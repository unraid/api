import { OnModuleInit } from '@nestjs/common';
import { Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { CpuPowerService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-power.service.js';
import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import {
    CpuPackages,
    CpuPower,
    CpuUtilization,
} from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryUtilization } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { Metrics } from '@app/unraid-api/graph/resolvers/metrics/metrics.model.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Resolver(() => Metrics)
export class MetricsResolver implements OnModuleInit {
    constructor(
        private readonly cpuService: CpuService,
        private readonly cpuPowerService: CpuPowerService,
        private readonly cpuTopologyService: CpuTopologyService,
        private readonly memoryService: MemoryService,
        private readonly subscriptionTracker: SubscriptionTrackerService,
        private readonly subscriptionHelper: SubscriptionHelperService
    ) {}

    onModuleInit() {
        // Register CPU polling with 1 second interval
        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.CPU_UTILIZATION,
            async () => {
                const payload = await this.cpuService.generateCpuLoad();
                pubsub.publish(PUBSUB_CHANNEL.CPU_UTILIZATION, { systemMetricsCpu: payload });
            },
            1000
        );
        // Register CPU power polling with 5 second interval
        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.CPU_TELEMETRY,
            async () => {
                // --- Gather telemetry ---
                const packageList = await this.cpuTopologyService.generateTelemetry();

                // --- Compute total power with 2 decimals ---
                const totalpower = Number(
                    packageList.reduce((sum, pkg) => sum + (pkg.power ?? 0), 0).toFixed(2)
                );

                // --- Build CpuPackages object ---
                const packages: CpuPackages = {
                    totalpower,
                    power: packageList.map((pkg) => pkg.power ?? -1),
                    temp: packageList.map((pkg) => pkg.temp ?? -1),
                };
                pubsub.publish(PUBSUB_CHANNEL.CPU_TELEMETRY, { systemMetricsCpuTelemetry: packages });
            },
            5000
        );

        // Register CPU power polling with 1 second interval
        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.CPU_POWER,
            async () => {
                const payload = await this.cpuPowerService.generateCpuPower();
                pubsub.publish(PUBSUB_CHANNEL.CPU_POWER, { systemMetricsCpuPower: payload });
            },
            5000
        );

        // Register memory polling with 2 second interval
        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.MEMORY_UTILIZATION,
            async () => {
                const payload = await this.memoryService.generateMemoryLoad();
                pubsub.publish(PUBSUB_CHANNEL.MEMORY_UTILIZATION, { systemMetricsMemory: payload });
            },
            2000
        );
    }

    @Query(() => Metrics)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
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
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    public async systemMetricsCpuSubscription() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.CPU_UTILIZATION);
    }

    @Subscription(() => CpuPower, {
        name: 'systemMetricsCpuPower',
        resolve: (value) => value.systemMetricsCpuPower,
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    public async systemMetricsCpuPowerSubscription() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.CPU_POWER);
    }

    @Subscription(() => CpuPackages, {
        name: 'systemMetricsCpuTelemtry',
        resolve: (value) => value.systemMetricsCpuTelemetry,
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    public async systemMetricsCpuTelemetrySubscription() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.CPU_TELEMETRY);
    }

    @Subscription(() => MemoryUtilization, {
        name: 'systemMetricsMemory',
        resolve: (value) => value.systemMetricsMemory,
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    public async systemMetricsMemorySubscription() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.MEMORY_UTILIZATION);
    }
}
