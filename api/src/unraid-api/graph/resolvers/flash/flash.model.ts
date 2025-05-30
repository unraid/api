import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

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
