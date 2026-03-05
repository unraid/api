import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

import { CpuUtilization } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { MemoryUtilization } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { TemperatureMetrics } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

@ObjectType({
    implements: () => Node,
    description: 'System metrics including CPU and memory utilization',
})
export class Metrics extends Node {
    @Field(() => CpuUtilization, { description: 'Current CPU utilization metrics', nullable: true })
    cpu?: CpuUtilization;

    @Field(() => MemoryUtilization, {
        description: 'Current memory utilization metrics',
        nullable: true,
    })
    memory?: MemoryUtilization;

    @Field(() => TemperatureMetrics, {
        nullable: true,
        description: 'Temperature metrics',
    })
    temperature?: TemperatureMetrics;
}
