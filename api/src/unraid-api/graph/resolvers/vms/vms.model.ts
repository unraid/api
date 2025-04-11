import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

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

@ObjectType()
export class VmDomain {
    @Field(() => ID)
    uuid!: string;

    @Field({ nullable: true, description: 'A friendly name for the vm' })
    name?: string;

    @Field(() => VmState, { description: 'Current domain vm state' })
    state!: VmState;
}

@ObjectType()
export class Vms {
    @Field(() => ID)
    id!: string;

    @Field(() => [VmDomain], { nullable: true })
    domains?: VmDomain[];

    @Field(() => [VmDomain], { nullable: true })
    domain?: VmDomain[];
}
