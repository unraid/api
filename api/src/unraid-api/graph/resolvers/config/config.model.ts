import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType({
    implements: () => Node,
})
export class Config extends Node {

    @Field(() => Boolean, { nullable: true })
    valid?: boolean | null;

    @Field(() => String, { nullable: true })
    error?: string | null;
}
