import { Field, GraphQLISODateTime, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { ParityCheckStatus } from '@app/core/modules/array/parity-check-status.js';

registerEnumType(ParityCheckStatus, {
    name: 'ParityCheckStatus',
});

@ObjectType()
export class ParityCheck {
    @Field(() => GraphQLISODateTime, { nullable: true, description: 'Date of the parity check' })
    date?: Date;

    @Field(() => Int, { nullable: true, description: 'Duration of the parity check in seconds' })
    duration?: number;

    @Field(() => String, { nullable: true, description: 'Speed of the parity check, in MB/s' })
    speed?: string;

    @Field(() => String, { nullable: true, description: 'Status of the parity check' })
    status?: string;

    @Field(() => Int, { nullable: true, description: 'Number of errors during the parity check' })
    errors?: number;

    @Field(() => Int, { nullable: true, description: 'Progress percentage of the parity check' })
    progress?: number;

    @Field(() => Boolean, {
        nullable: true,
        description: 'Whether corrections are being written to parity',
    })
    correcting?: boolean;

    @Field(() => Boolean, { nullable: true, description: 'Whether the parity check is paused' })
    paused?: boolean;

    @Field(() => Boolean, { nullable: true, description: 'Whether the parity check is running' })
    running?: boolean;
}
