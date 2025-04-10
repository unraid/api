import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ParityCheck {
    @Field()
    date: string = '';

    @Field()
    duration: number = 0;

    @Field()
    speed: string = '';

    @Field()
    status: string = '';

    @Field()
    errors: string = '';
}

@ObjectType()
export class ParityCheckHistory {
    @Field(() => [ParityCheck])
    parityChecks: ParityCheck[] = [];
}
