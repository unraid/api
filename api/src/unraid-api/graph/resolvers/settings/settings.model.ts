import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { IsObject, ValidateNested } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType({
    implements: () => Node,
})
export class UnifiedSettings extends Node {
    @Field(() => GraphQLJSON, { description: 'The data schema for the settings' })
    @IsObject()
    dataSchema!: Record<string, any>;

    @Field(() => GraphQLJSON, { description: 'The UI schema for the settings' })
    @IsObject()
    uiSchema!: Record<string, any>;

    @Field(() => GraphQLJSON, { description: 'The current values of the settings' })
    @IsObject()
    values!: Record<string, any>;
}

@ObjectType({
    implements: () => Node,
})
export class Settings extends Node {
    @Field(() => UnifiedSettings, { description: 'A view of all settings' })
    @ValidateNested()
    unified!: UnifiedSettings;
}
