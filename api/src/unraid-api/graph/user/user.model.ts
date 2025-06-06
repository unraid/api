import { Field, ObjectType } from '@nestjs/graphql';

import { Node, Role } from '@unraid/shared/graphql.model.js';

import { Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';

@ObjectType({ implements: () => Node })
export class UserAccount extends Node {
    @Field({ description: 'The name of the user' })
    name!: string;

    @Field({ description: 'A description of the user' })
    description!: string;

    @Field(() => [Role], { description: 'The roles of the user' })
    roles!: Role[];

    @Field(() => [Permission], { description: 'The permissions of the user', nullable: true })
    permissions?: Permission[];
}
