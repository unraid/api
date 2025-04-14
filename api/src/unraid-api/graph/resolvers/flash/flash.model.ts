import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType({
    implements: () => Node,
})
export class Flash extends Node {

    @Field(() => String)
    guid!: string;

    @Field(() => String)
    vendor!: string;

    @Field(() => String)
    product!: string;
}
