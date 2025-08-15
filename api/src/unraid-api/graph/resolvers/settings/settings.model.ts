import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { IsObject, ValidateNested } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import { SsoSettings } from '@app/unraid-api/graph/resolvers/settings/sso-settings.model.js';

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

@ObjectType()
export class UpdateSettingsResponse {
    @Field(() => Boolean, {
        description: 'Whether a restart is required for the changes to take effect',
    })
    restartRequired!: boolean;

    @Field(() => GraphQLJSON, { description: 'The updated settings values' })
    values!: Record<string, any>;

    @Field(() => [String], {
        nullable: true,
        description: 'Warning messages about configuration issues found during validation',
    })
    warnings?: string[];
}

@ObjectType({
    implements: () => Node,
})
export class Settings extends Node {
    @Field(() => UnifiedSettings, { description: 'A view of all settings' })
    @ValidateNested()
    unified!: UnifiedSettings;

    @Field(() => SsoSettings, { description: 'SSO settings' })
    @ValidateNested()
    sso!: SsoSettings;
}
