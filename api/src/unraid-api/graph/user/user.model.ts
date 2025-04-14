import { Field, ObjectType } from '@nestjs/graphql';

import { Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { Role } from '@app/unraid-api/graph/resolvers/base.model.js';
import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

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
