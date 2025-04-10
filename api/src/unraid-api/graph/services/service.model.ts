import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType()
export class Uptime {
    @Field(() => String, { nullable: true })
    timestamp?: string;
}

@ObjectType({
    implements: () => Node,
})
export class Service implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    name?: string;

    @Field(() => Boolean, { nullable: true })
    online?: boolean;

    @Field(() => Uptime, { nullable: true })
    uptime?: Uptime;

    @Field(() => String, { nullable: true })
    version?: string;
}
