import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { GraphQLPort } from 'graphql-scalars';
import { GraphQLJSONObject } from 'graphql-type-json';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType({ implements: () => Node })
export class LxcContainer extends Node {
    @Field(() => String)
    name!: string;
    @Field(() => String)
    state!: string;
    @Field(() => String)
    ipv4!: string;
    @Field(() => String)
    autostart!: string;
}

@ObjectType({ implements: () => Node })
@ObjectType({
    implements: () => Node,
})
export class Lxc extends Node {
    @Field(() => [LxcContainer])
    containers!: LxcContainer[];
}
