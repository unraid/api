import { Field, Float, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { GraphQLBigInt } from 'graphql-scalars';

@ObjectType({ implements: () => Node })
export class NetworkMetrics extends Node {
    @Field({ description: 'Interface identifier' })
    name!: string;

    @Field({ nullable: true, description: 'Operational state' })
    operstate?: string;

    @Field(() => GraphQLBigInt, { description: 'Total received bytes' })
    bytesReceived!: number;

    @Field(() => GraphQLBigInt, { description: 'Total transmitted bytes' })
    bytesSent!: number;

    @Field(() => GraphQLBigInt, { description: 'Total received packets' })
    packetsReceived!: number;

    @Field(() => GraphQLBigInt, { description: 'Total transmitted packets' })
    packetsSent!: number;

    @Field(() => GraphQLBigInt, { description: 'Receive errors' })
    receiveErrors!: number;

    @Field(() => GraphQLBigInt, { description: 'Transmit errors' })
    transmitErrors!: number;

    @Field(() => GraphQLBigInt, { description: 'Dropped receive packets' })
    receiveDropped!: number;

    @Field(() => GraphQLBigInt, { description: 'Dropped transmit packets' })
    transmitDropped!: number;

    @Field(() => Float, { description: 'Receive throughput in bytes per second' })
    rxSec!: number;

    @Field(() => Float, { description: 'Transmit throughput in bytes per second' })
    txSec!: number;

    @Field(() => Float, { nullable: true, description: 'Estimated link utilization percentage' })
    utilizationPercent?: number;

    @Field(() => GraphQLISODateTime, { description: 'Metric collection timestamp' })
    lastUpdated!: Date;
}
