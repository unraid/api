import { Field, ObjectType } from '@nestjs/graphql';

/**
 * @todo Deprecate this type in favor of the UserAccount type
 */
@ObjectType()
export class Owner {
    @Field(() => String)
    username!: string;

    @Field(() => String)
    url!: string;

    @Field(() => String)
    avatar!: string;
}
