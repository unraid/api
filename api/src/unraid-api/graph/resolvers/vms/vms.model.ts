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

    @Field(() => [VmDomain])
    domain!: VmDomain[];
}

@ObjectType()
export class VmMutations {
    @Field(() => Boolean, { description: 'Start a virtual machine' })
    startVm(id: string): boolean {
        return true;
    }

    @Field(() => Boolean, { description: 'Stop a virtual machine' })
    stopVm(id: string): boolean {
        return true;
    }

    @Field(() => Boolean, { description: 'Pause a virtual machine' })
    pauseVm(id: string): boolean {
        return true;
    }

    @Field(() => Boolean, { description: 'Resume a virtual machine' })
    resumeVm(id: string): boolean {
        return true;
    }

    @Field(() => Boolean, { description: 'Force stop a virtual machine' })
    forceStopVm(id: string): boolean {
        return true;
    }

    @Field(() => Boolean, { description: 'Reboot a virtual machine' })
    rebootVm(id: string): boolean {
        return true;
    }

    @Field(() => Boolean, { description: 'Reset a virtual machine' })
    resetVm(id: string): boolean {
        return true;
    }
}
