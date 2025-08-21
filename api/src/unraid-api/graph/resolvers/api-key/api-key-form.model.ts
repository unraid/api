import { Field, ObjectType } from '@nestjs/graphql';

import { IsObject } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class ApiKeyFormSchema {
    @Field(() => GraphQLJSON, { description: 'JSON Schema for the form data' })
    @IsObject()
    schema!: Record<string, any>;

    @Field(() => GraphQLJSON, { description: 'UI Schema for form layout' })
    @IsObject()
    uiSchema!: Record<string, any>;

    @Field(() => GraphQLJSON, { nullable: true, description: 'Initial form data' })
    @IsObject()
    formData?: Record<string, any>;
}
