import { Field, ID, ObjectType } from '@nestjs/graphql';

import { Permission } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { Role } from '@app/unraid-api/graph/resolvers/base.model.js';

@ObjectType()
export class UserAccount {
    @Field(() => ID, { description: 'A unique identifier for the user' })
    id!: string;

    @Field({ description: 'The name of the user' })
    name!: string;

    @Field({ description: 'A description of the user' })
    description!: string;

    @Field(() => [Role], { description: 'The roles of the user' })
    roles!: Role[];

    @Field(() => [Permission], { description: 'The permissions of the user', nullable: true })
    permissions?: Permission[];
}
