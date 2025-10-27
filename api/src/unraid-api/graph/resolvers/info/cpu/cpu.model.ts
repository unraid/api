import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType({ description: 'CPU load for a single core' })
export class CpuLoad {
    @Field(() => Float, { description: 'The total CPU load on a single core, in percent.' })
    percentTotal!: number;

    @Field(() => Float, { description: 'The percentage of time the CPU spent in user space.' })
    percentUser!: number;

    @Field(() => Float, { description: 'The percentage of time the CPU spent in kernel space.' })
    percentSystem!: number;

    @Field(() => Float, {
        description:
            'The percentage of time the CPU spent on low-priority (niced) user space processes.',
    })
    percentNice!: number;

    @Field(() => Float, { description: 'The percentage of time the CPU was idle.' })
    percentIdle!: number;

    @Field(() => Float, {
        description: 'The percentage of time the CPU spent servicing hardware interrupts.',
    })
    percentIrq!: number;

    @Field(() => Float, {
        description: 'The percentage of time the CPU spent running virtual machines (guest).',
    })
    percentGuest!: number;

    @Field(() => Float, {
        description: 'The percentage of CPU time stolen by the hypervisor.',
    })
    percentSteal!: number;
}

@ObjectType()
export class CpuPackages {
    @Field(() => Float, { description: 'Total CPU package power draw (W)' })
    totalPower?: number;

    @Field(() => [Float], { description: 'Power draw per package (W)' })
    power?: number[];

    @Field(() => [Float], { description: 'Temperature per package (°C)' })
    temp?: number[];
}

@ObjectType({ implements: () => Node })
export class CpuUtilization extends Node {
    @Field(() => Float, { description: 'Total CPU load in percent' })
    percentTotal!: number;

    @Field(() => [CpuLoad], { description: 'CPU load for each core' })
    cpus!: CpuLoad[];
}

@ObjectType({ implements: () => Node })
export class InfoCpu extends Node {
    @Field(() => String, { nullable: true, description: 'CPU manufacturer' })
    manufacturer?: string;

    @Field(() => String, { nullable: true, description: 'CPU brand name' })
    brand?: string;

    @Field(() => String, { nullable: true, description: 'CPU vendor' })
    vendor?: string;

    @Field(() => String, { nullable: true, description: 'CPU family' })
    family?: string;

    @Field(() => String, { nullable: true, description: 'CPU model' })
    model?: string;

    @Field(() => Int, { nullable: true, description: 'CPU stepping' })
    stepping?: number;

    @Field(() => String, { nullable: true, description: 'CPU revision' })
    revision?: string;

    @Field(() => String, { nullable: true, description: 'CPU voltage' })
    voltage?: string;

    @Field(() => Float, { nullable: true, description: 'Current CPU speed in GHz' })
    speed?: number;

    @Field(() => Float, { nullable: true, description: 'Minimum CPU speed in GHz' })
    speedmin?: number;

    @Field(() => Float, { nullable: true, description: 'Maximum CPU speed in GHz' })
    speedmax?: number;

    @Field(() => Int, { nullable: true, description: 'Number of CPU threads' })
    threads?: number;

    @Field(() => Int, { nullable: true, description: 'Number of CPU cores' })
    cores?: number;

    @Field(() => Int, { nullable: true, description: 'Number of physical processors' })
    processors?: number;

    @Field(() => String, { nullable: true, description: 'CPU socket type' })
    socket?: string;

    @Field(() => GraphQLJSON, { nullable: true, description: 'CPU cache information' })
    cache?: Record<string, any>;

    @Field(() => [String], { nullable: true, description: 'CPU feature flags' })
    flags?: string[];

    @Field(() => [[[Int]]], {
        description: 'Per-package array of core/thread pairs, e.g. [[[0,1],[2,3]], [[4,5],[6,7]]]',
    })
    topology!: number[][][];

    @Field(() => CpuPackages)
    packages!: CpuPackages;
}
