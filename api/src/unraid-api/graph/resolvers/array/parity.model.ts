import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ParityCheck {
    @Field(() => String, { nullable: true })
    date?: string;

    @Field(() => Number, { nullable: true })
    duration?: number;

    @Field(() => String, { nullable: true })
    speed?: string;

    @Field(() => String, { nullable: true })
    status?: string;

    @Field(() => String, { nullable: true })
    errors?: string;
}

@ObjectType()
export class ParityCheckHistory {
    @Field(() => [ParityCheck])
    parityChecks: ParityCheck[] = [];
}
