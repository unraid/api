import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';
@ObjectType()
export class Config implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => Boolean, { nullable: true })
    valid?: boolean;

    @Field(() => String, { nullable: true })
    error?: string;
}
