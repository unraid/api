import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType()
export class Flash implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String)
    guid!: string;

    @Field(() => String)
    vendor!: string;

    @Field(() => String)
    product!: string;
}
