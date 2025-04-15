import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

import { type Layout } from '@jsonforms/core';
import { GraphQLJSON } from 'graphql-scalars';

import { DataSlice } from '@app/unraid-api/types/json-forms.js';

@ObjectType()
export class RCloneDrive {
    @Field(() => String, { description: 'Provider name' })
    name!: string;

    @Field(() => GraphQLJSON, { description: 'Provider options and configuration schema' })
    options!: Record<string, unknown>;
}

/**
 * Raw response format from rclone API
 */
export interface RCloneProviderResponse {
    Name: string;
    Description: string;
    Prefix: string;
    Options: RCloneProviderOptionResponse[];
    CommandHelp?: string | null;
    Aliases?: string[] | null;
    Hide?: boolean;
    MetadataInfo?: Record<string, unknown>;
}

/**
 * Raw option format from rclone API
 */
export interface RCloneProviderOptionResponse {
    Name: string;
    Help: string;
    Provider: string;
    Default?: unknown;
    Value?: unknown;
    ShortOpt?: string;
    Hide?: boolean;
    Required?: boolean;
    IsPassword?: boolean;
    NoPrefix?: boolean;
    Advanced?: boolean;
    DefaultStr?: string;
    ValueStr?: string;
    Type?: string;
    Examples?: Array<{ Value: string; Help: string; Provider: string }>;
}

@ObjectType()
export class RCloneProviderOption {
    @Field(() => String)
    name!: string;

    @Field(() => String)
    help!: string;

    @Field(() => String)
    provider!: string;

    @Field(() => GraphQLJSON, { nullable: true })
    default?: unknown;

    @Field(() => GraphQLJSON, { nullable: true })
    value?: unknown;

    @Field(() => String, { nullable: true })
    shortOpt?: string;

    @Field(() => Boolean, { nullable: true })
    hide?: boolean;

    @Field(() => Boolean, { nullable: true })
    required?: boolean;

    @Field(() => Boolean, { nullable: true })
    isPassword?: boolean;

    @Field(() => Boolean, { nullable: true })
    noPrefix?: boolean;

    @Field(() => Boolean, { nullable: true })
    advanced?: boolean;

    @Field(() => String, { nullable: true })
    defaultStr?: string;

    @Field(() => String, { nullable: true })
    valueStr?: string;

    @Field(() => String, { nullable: true })
    type?: string;

    @Field(() => [RCloneProviderOptionExample], { nullable: true })
    examples?: RCloneProviderOptionExample[];
}

@ObjectType()
export class RCloneProviderOptionExample {
    @Field(() => String)
    value!: string;

    @Field(() => String)
    help!: string;

    @Field(() => String)
    provider!: string;
}

@ObjectType()
export class RCloneProviderTypes {
    @Field(() => [String], { description: 'List of all provider types' })
    types!: string[];
}

/**
 *     {
      Name: 'jottacloud',
      Description: 'Jottacloud',
      Prefix: 'jottacloud',
      Options: [Array],
      CommandHelp: null,
      Aliases: null,
      Hide: false,
      MetadataInfo: [Object]
    },
 */
@ObjectType()
export class RCloneProvider {
    @Field(() => String)
    name!: string;

    @Field(() => String)
    description!: string;

    @Field(() => String)
    prefix!: string;

    @Field(() => [RCloneProviderOption])
    options!: RCloneProviderOption[];
}

@ObjectType()
export class RCloneBackupConfigForm {
    @Field(() => ID)
    id!: string;

    @Field(() => GraphQLJSON)
    dataSchema!: { properties: DataSlice; type: 'object' };

    @Field(() => GraphQLJSON)
    uiSchema!: Layout;
}

@ObjectType()
export class RCloneBackupSettings {
    @Field(() => RCloneBackupConfigForm)
    configForm!: RCloneBackupConfigForm;

    @Field(() => [RCloneDrive])
    drives!: RCloneDrive[];

    @Field(() => [String])
    remotes!: string[];
}

@ObjectType()
export class RCloneRemote {
    @Field(() => String)
    name!: string;

    @Field(() => String)
    type!: string;

    @Field(() => GraphQLJSON)
    config!: Record<string, unknown>;
}

@InputType()
export class CreateRCloneRemoteInput {
    @Field(() => String)
    name!: string;

    @Field(() => String)
    type!: string;

    @Field(() => GraphQLJSON)
    parameters!: Record<string, unknown>;
}
