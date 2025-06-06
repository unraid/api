import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

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
    @IsString()
    name?: string;

    @Field(() => VmState, { description: 'Current domain vm state' })
    @IsEnum(VmState)
    state!: VmState;

    @Field(() => String, {
        nullable: true,
        description: 'The UUID of the vm',
        deprecationReason: 'Use id instead',
    })
    uuid?: string;
}

@ObjectType({ implements: () => Node })
export class Vms extends Node {
    @Field(() => [VmDomain], { nullable: true })
    domains?: VmDomain[];

    @Field(() => [VmDomain], { nullable: true })
    domain?: VmDomain[];
}
