import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OidcSessionValidation {
    @Field(() => Boolean)
    valid!: boolean;

    @Field(() => String, { nullable: true })
    username?: string;
}
