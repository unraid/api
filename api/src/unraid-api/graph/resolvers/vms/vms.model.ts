import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

// Register the VmState enum
export enum VmState {
    NOSTATE = 'NOSTATE',
    RUNNING = 'RUNNING',
    IDLE = 'IDLE',
    PAUSED = 'PAUSED',
    SHUTDOWN = 'SHUTDOWN',
    SHUTOFF = 'SHUTOFF',
    CRASHED = 'CRASHED',
    PMSUSPENDED = 'PMSUSPENDED',
}

registerEnumType(VmState, {
    name: 'VmState',
    description: 'The state of a virtual machine',
});

@ObjectType({ implements: () => Node })
export class VmDomain implements Node {
    @Field(() => PrefixedID, { description: 'The unique identifier for the vm (uuid)' })
    @IsString()
    @IsNotEmpty()
    id!: string;

    @Field({ nullable: true, description: 'A friendly name for the vm' })
    name?: string;

    @Field(() => VmState, { description: 'Current domain vm state' })
    state!: VmState;
}

@ObjectType({ implements: () => Node })
export class Vms extends Node {
    @Field(() => [VmDomain], { nullable: true })
    domains?: VmDomain[];

    @Field(() => [VmDomain], { nullable: true })
    domain?: VmDomain[];
}
