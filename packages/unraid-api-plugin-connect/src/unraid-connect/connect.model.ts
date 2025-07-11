import { Field, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { AccessUrl, URL_TYPE } from '@unraid/shared/network.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { GraphQLJSON, GraphQLURL } from 'graphql-scalars';

export enum WAN_ACCESS_TYPE {
    DYNAMIC = 'DYNAMIC',
    ALWAYS = 'ALWAYS',
    DISABLED = 'DISABLED',
}

export enum WAN_FORWARD_TYPE {
    UPNP = 'UPNP',
    STATIC = 'STATIC',
}

export enum DynamicRemoteAccessType {
    STATIC = 'STATIC',
    UPNP = 'UPNP',
    DISABLED = 'DISABLED',
}

registerEnumType(DynamicRemoteAccessType, {
    name: 'DynamicRemoteAccessType',
});

registerEnumType(WAN_ACCESS_TYPE, {
    name: 'WAN_ACCESS_TYPE',
});

registerEnumType(WAN_FORWARD_TYPE, {
    name: 'WAN_FORWARD_TYPE',
});

@InputType()
export class AccessUrlInput {
    @Field(() => URL_TYPE)
    @IsEnum(URL_TYPE)
    type!: URL_TYPE;

    @Field(() => String, { nullable: true })
    @IsOptional()
    name?: string | null;

    @Field(() => GraphQLURL, { nullable: true })
    @IsOptional()
    ipv4?: URL | null;

    @Field(() => GraphQLURL, { nullable: true })
    @IsOptional()
    ipv6?: URL | null;
}

@InputType()
export class ConnectUserInfoInput {
    @Field(() => String, { description: 'The preferred username of the user' })
    @IsString()
    @IsNotEmpty()
    preferred_username!: string;

    @Field(() => String, { description: 'The email address of the user' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @Field(() => String, { nullable: true, description: 'The avatar URL of the user' })
    @IsString()
    @IsOptional()
    avatar?: string;
}

@InputType()
export class ConnectSignInInput {
    @Field(() => String, { description: 'The API key for authentication' })
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    apiKey!: string;

    @Field(() => ConnectUserInfoInput, {
        nullable: true,
        description: 'User information for the sign-in',
    })
    @ValidateNested()
    @IsOptional()
    userInfo?: ConnectUserInfoInput;
}

@InputType()
export class AllowedOriginInput {
    @Field(() => [String], { description: 'A list of origins allowed to interact with the API' })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    origins!: string[];
}

@ObjectType()
export class RemoteAccess {
    @Field(() => WAN_ACCESS_TYPE, { description: 'The type of WAN access used for Remote Access' })
    @IsEnum(WAN_ACCESS_TYPE)
    accessType!: WAN_ACCESS_TYPE;

    @Field(() => WAN_FORWARD_TYPE, {
        nullable: true,
        description: 'The type of port forwarding used for Remote Access',
    })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE;

    @Field(() => Int, { nullable: true, description: 'The port used for Remote Access' })
    @IsOptional()
    port?: number | null;
}

@InputType()
export class SetupRemoteAccessInput {
    @Field(() => WAN_ACCESS_TYPE, { description: 'The type of WAN access to use for Remote Access' })
    @IsEnum(WAN_ACCESS_TYPE)
    accessType!: WAN_ACCESS_TYPE;

    @Field(() => WAN_FORWARD_TYPE, {
        nullable: true,
        description: 'The type of port forwarding to use for Remote Access',
    })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE | null;

    @Field(() => Int, {
        nullable: true,
        description:
            'The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP.',
    })
    @IsOptional()
    port?: number | null;
}

@InputType()
export class EnableDynamicRemoteAccessInput {
    @Field(() => AccessUrlInput, { description: 'The AccessURL Input for dynamic remote access' })
    @ValidateNested()
    url!: AccessUrlInput;

    @Field(() => Boolean, { description: 'Whether to enable or disable dynamic remote access' })
    @IsBoolean()
    enabled!: boolean;
}

@ObjectType()
export class DynamicRemoteAccessStatus {
    @Field(() => DynamicRemoteAccessType, {
        description: 'The type of dynamic remote access that is enabled',
    })
    @IsEnum(DynamicRemoteAccessType)
    enabledType!: DynamicRemoteAccessType;

    @Field(() => DynamicRemoteAccessType, {
        description: 'The type of dynamic remote access that is currently running',
    })
    @IsEnum(DynamicRemoteAccessType)
    runningType!: DynamicRemoteAccessType;

    @Field(() => String, {
        nullable: true,
        description: 'Any error message associated with the dynamic remote access',
    })
    @IsString()
    @IsOptional()
    error?: string;
}

@ObjectType()
export class ConnectSettingsValues {
    @Field(() => WAN_ACCESS_TYPE, { description: 'The type of WAN access used for Remote Access' })
    @IsEnum(WAN_ACCESS_TYPE)
    accessType!: WAN_ACCESS_TYPE;

    @Field(() => WAN_FORWARD_TYPE, {
        nullable: true,
        description: 'The type of port forwarding used for Remote Access',
    })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE;

    @Field(() => Int, { nullable: true, description: 'The port used for Remote Access' })
    @IsOptional()
    @IsNumber()
    port?: number | null;
}

@InputType()
export class ConnectSettingsInput {
    @Field(() => WAN_ACCESS_TYPE, {
        nullable: true,
        description: 'The type of WAN access to use for Remote Access',
    })
    @IsEnum(WAN_ACCESS_TYPE)
    @IsOptional()
    accessType?: WAN_ACCESS_TYPE | null;

    @Field(() => WAN_FORWARD_TYPE, {
        nullable: true,
        description: 'The type of port forwarding to use for Remote Access',
    })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE | null;

    @Field(() => Int, {
        nullable: true,
        description:
            'The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP.',
    })
    @IsOptional()
    port?: number | null;
}

@ObjectType({
    implements: () => Node,
})
export class ConnectSettings implements Node {
    @Field(() => PrefixedID)
    @IsString()
    @IsNotEmpty()
    id!: string;

    @Field(() => GraphQLJSON, { description: 'The data schema for the Connect settings' })
    @IsObject()
    dataSchema!: Record<string, any>;

    @Field(() => GraphQLJSON, { description: 'The UI schema for the Connect settings' })
    @IsObject()
    uiSchema!: Record<string, any>;

    @Field(() => ConnectSettingsValues, { description: 'The values for the Connect settings' })
    @ValidateNested()
    values!: ConnectSettingsValues;
}

@ObjectType({
    implements: () => Node,
})
export class Connect extends Node {
    @Field(() => DynamicRemoteAccessStatus, { description: 'The status of dynamic remote access' })
    @ValidateNested()
    dynamicRemoteAccess?: DynamicRemoteAccessStatus;

    @Field(() => ConnectSettings, { description: 'The settings for the Connect instance' })
    @ValidateNested()
    settings?: ConnectSettings;
}

@ObjectType({
    implements: () => Node,
})
export class Network extends Node {
    @Field(() => [AccessUrl], { nullable: true })
    accessUrls?: AccessUrl[];
}
