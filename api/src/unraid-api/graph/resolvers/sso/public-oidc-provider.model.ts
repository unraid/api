import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicOidcProvider {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: false })
    name!: string;

    @Field(() => String, { nullable: true })
    buttonText?: string;

    @Field(() => String, { nullable: true })
    buttonIcon?: string;
}
