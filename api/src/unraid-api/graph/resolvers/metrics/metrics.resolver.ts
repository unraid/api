import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Int, Mutation, Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { CpuTopologyService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu-topology.service.js';
import { CpuPackages, CpuUtilization } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { CpuService } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.service.js';
import { MemoryUtilization } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { MemoryService } from '@app/unraid-api/graph/resolvers/info/memory/memory.service.js';
import { Metrics } from '@app/unraid-api/graph/resolvers/metrics/metrics.model.js';
import { TemperatureConfigInput } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.input.js';
import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import { TemperatureMetrics } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';
import { SubscriptionHelperService } from '@app/unraid-api/graph/services/subscription-helper.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Resolver(() => Metrics)
export class MetricsResolver implements OnModuleInit {
    private readonly logger = new Logger(MetricsResolver.name);
    constructor(
        private readonly cpuService: CpuService,
        private readonly cpuTopologyService: CpuTopologyService,
        private readonly memoryService: MemoryService,
        private readonly temperatureService: TemperatureService,
        private readonly subscriptionTracker: SubscriptionTrackerService,
        private readonly subscriptionHelper: SubscriptionHelperService,
        private readonly configService: ConfigService,
        private readonly temperatureConfigService: TemperatureConfigService
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

        this.subscriptionTracker.registerTopic(
            PUBSUB_CHANNEL.CPU_TELEMETRY,
            async () => {
                const packageList = (await this.cpuTopologyService.generateTelemetry()) ?? [];

                // Compute total power with 2 decimals
                const totalPower = Number(
                    packageList
                        .map((pkg) => pkg.power)
                        .filter((power) => power >= 0)
                        .reduce((sum, power) => sum + power, 0)
                        .toFixed(2)
                );

                const packages: CpuPackages = {
                    id: 'metrics/cpu/packages',
                    totalPower,
                    power: packageList.map((pkg) => pkg.power ?? -1),
                    temp: packageList.map((pkg) => pkg.temp ?? -1),
                };
                this.logger.debug(`CPU_TELEMETRY payload: ${JSON.stringify(packages)}`);

                // Publish the payload
                pubsub.publish(PUBSUB_CHANNEL.CPU_TELEMETRY, {
                    systemMetricsCpuTelemetry: packages,
                });

                this.logger.debug(`CPU_TELEMETRY payload2: ${JSON.stringify(packages)}`);
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

        const { enabled, polling_interval } = this.temperatureConfigService.getConfig();

        if (enabled) {
            this.subscriptionTracker.registerTopic(
                PUBSUB_CHANNEL.TEMPERATURE_METRICS,
                async () => {
                    const payload = await this.temperatureService.getMetrics();
                    if (payload) {
                        pubsub.publish(PUBSUB_CHANNEL.TEMPERATURE_METRICS, {
                            systemMetricsTemperature: payload,
                        });
                    }
                },
                polling_interval
            );
        }
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

    @Subscription(() => CpuPackages, {
        name: 'systemMetricsCpuTelemetry',
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

    @ResolveField(() => TemperatureMetrics, { nullable: true })
    public async temperature(): Promise<TemperatureMetrics | null> {
        return this.temperatureService.getMetrics();
    }
    @Subscription(() => TemperatureMetrics, {
        name: 'systemMetricsTemperature',
        resolve: (value) => value.systemMetricsTemperature,
        nullable: true,
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    public async systemMetricsTemperatureSubscription() {
        return this.subscriptionHelper.createTrackedSubscription(PUBSUB_CHANNEL.TEMPERATURE_METRICS);
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.INFO,
    })
    public async updateTemperatureConfig(
        @Args('input', { type: () => TemperatureConfigInput }) input: TemperatureConfigInput
    ): Promise<boolean> {
        if (input.enabled !== undefined) {
            this.configService.set('temperature.enabled', input.enabled);
        }
        if (input.polling_interval !== undefined) {
            this.configService.set('temperature.polling_interval', input.polling_interval);
        }
        if (input.default_unit !== undefined) {
            this.configService.set('temperature.default_unit', input.default_unit);
        }

        if (input.sensors) {
            if (input.sensors.lm_sensors) {
                if (input.sensors.lm_sensors.enabled !== undefined) {
                    this.configService.set(
                        'temperature.sensors.lm_sensors.enabled',
                        input.sensors.lm_sensors.enabled
                    );
                }
                if (input.sensors.lm_sensors.config_path !== undefined) {
                    this.configService.set(
                        'temperature.sensors.lm_sensors.config_path',
                        input.sensors.lm_sensors.config_path
                    );
                }
            }
            if (input.sensors.smartctl) {
                if (input.sensors.smartctl.enabled !== undefined) {
                    this.configService.set(
                        'temperature.sensors.smartctl.enabled',
                        input.sensors.smartctl.enabled
                    );
                }
            }
            if (input.sensors.ipmi) {
                if (input.sensors.ipmi.enabled !== undefined) {
                    this.configService.set(
                        'temperature.sensors.ipmi.enabled',
                        input.sensors.ipmi.enabled
                    );
                }
                if (input.sensors.ipmi.args !== undefined) {
                    this.configService.set('temperature.sensors.ipmi.args', input.sensors.ipmi.args);
                }
            }
        }

        if (input.thresholds) {
            if (input.thresholds.cpu_warning !== undefined) {
                this.configService.set(
                    'temperature.thresholds.cpu_warning',
                    input.thresholds.cpu_warning
                );
            }
            if (input.thresholds.cpu_critical !== undefined) {
                this.configService.set(
                    'temperature.thresholds.cpu_critical',
                    input.thresholds.cpu_critical
                );
            }
            if (input.thresholds.disk_warning !== undefined) {
                this.configService.set(
                    'temperature.thresholds.disk_warning',
                    input.thresholds.disk_warning
                );
            }
            if (input.thresholds.disk_critical !== undefined) {
                this.configService.set(
                    'temperature.thresholds.disk_critical',
                    input.thresholds.disk_critical
                );
            }
            if (input.thresholds.warning !== undefined) {
                this.configService.set('temperature.thresholds.warning', input.thresholds.warning);
            }
            if (input.thresholds.critical !== undefined) {
                this.configService.set('temperature.thresholds.critical', input.thresholds.critical);
            }
        }

        if (input.history) {
            if (input.history.max_readings !== undefined) {
                this.configService.set('temperature.history.max_readings', input.history.max_readings);
            }
            if (input.history.retention_ms !== undefined) {
                this.configService.set('temperature.history.retention_ms', input.history.retention_ms);
            }
        }

        return true;
    }
}
