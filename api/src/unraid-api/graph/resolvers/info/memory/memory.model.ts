import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { GraphQLBigInt } from 'graphql-scalars';

@ObjectType({ implements: () => Node })
export class MemoryLayout extends Node {
    @Field(() => GraphQLBigInt, { description: 'Memory module size in bytes' })
    size!: number;

    @Field(() => String, { nullable: true, description: 'Memory bank location (e.g., BANK 0)' })
    bank?: string;

    @Field(() => String, { nullable: true, description: 'Memory type (e.g., DDR4, DDR5)' })
    type?: string;

    @Field(() => Int, { nullable: true, description: 'Memory clock speed in MHz' })
    clockSpeed?: number;

    @Field(() => String, { nullable: true, description: 'Part number of the memory module' })
    partNum?: string;

    @Field(() => String, { nullable: true, description: 'Serial number of the memory module' })
    serialNum?: string;

    @Field(() => String, { nullable: true, description: 'Memory manufacturer' })
    manufacturer?: string;

    @Field(() => String, { nullable: true, description: 'Form factor (e.g., DIMM, SODIMM)' })
    formFactor?: string;

    @Field(() => Int, { nullable: true, description: 'Configured voltage in millivolts' })
    voltageConfigured?: number;

    @Field(() => Int, { nullable: true, description: 'Minimum voltage in millivolts' })
    voltageMin?: number;

    @Field(() => Int, { nullable: true, description: 'Maximum voltage in millivolts' })
    voltageMax?: number;
}

@ObjectType({ implements: () => Node })
export class MemoryUtilization extends Node {
    @Field(() => GraphQLBigInt, { description: 'Total system memory in bytes' })
    total!: number;

    @Field(() => GraphQLBigInt, { description: 'Used memory in bytes' })
    used!: number;

    @Field(() => GraphQLBigInt, { description: 'Free memory in bytes' })
    free!: number;

    @Field(() => GraphQLBigInt, { description: 'Available memory in bytes' })
    available!: number;

    @Field(() => GraphQLBigInt, { description: 'Active memory in bytes' })
    active!: number;

    @Field(() => GraphQLBigInt, { description: 'Buffer/cache memory in bytes' })
    buffcache!: number;

    @Field(() => Float, { description: 'Memory usage percentage' })
    usedPercent!: number;

    @Field(() => GraphQLBigInt, { description: 'Total swap memory in bytes' })
    swapTotal!: number;

    @Field(() => GraphQLBigInt, { description: 'Used swap memory in bytes' })
    swapUsed!: number;

    @Field(() => GraphQLBigInt, { description: 'Free swap memory in bytes' })
    swapFree!: number;

    @Field(() => Float, { description: 'Swap usage percentage' })
    swapUsedPercent!: number;
}

@ObjectType({ implements: () => Node })
export class InfoMemory extends Node {
    @Field(() => [MemoryLayout], { description: 'Physical memory layout' })
    layout!: MemoryLayout[];

    @Field(() => MemoryUtilization, {
        description: 'Current memory utilization and totals',
        nullable: true,
    })
    utilization?: MemoryUtilization;
}
