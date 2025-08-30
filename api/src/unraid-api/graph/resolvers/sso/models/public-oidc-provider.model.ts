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

    @Field(() => String, { nullable: true })
    buttonVariant?: string;

    @Field(() => String, { nullable: true })
    buttonStyle?: string;
}
