import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

import { type Layout } from '@jsonforms/core';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
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
    Hide?: number;
    Required?: boolean;
    IsPassword?: boolean;
    NoPrefix?: boolean;
    Advanced?: boolean;
    DefaultStr?: string;
    ValueStr?: string;
    Type?: string;
    Examples?: Array<{ Value: string; Help: string; Provider: string }>;
}

@InputType()
export class RCloneConfigFormInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    providerType?: string;

    @Field(() => Boolean, { defaultValue: false, nullable: true })
    @IsOptional()
    @IsBoolean()
    showAdvanced?: boolean;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    parameters?: Record<string, unknown>;
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
    parameters!: Record<string, unknown>;
}

@InputType()
export class CreateRCloneRemoteInput {
    @Field(() => String)
    @IsString()
    name!: string;

    @Field(() => String)
    @IsString()
    type!: string;

    @Field(() => GraphQLJSON)
    @IsObject()
    parameters!: Record<string, unknown>;
}
