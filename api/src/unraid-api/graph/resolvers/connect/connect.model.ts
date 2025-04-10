import { Field, InputType, ObjectType, ID, Int } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, IsArray, IsEnum, IsBoolean, IsNumber, IsPort, IsNotEmpty, IsObject, ValidateNested, ArrayMinSize } from 'class-validator';

export enum WAN_ACCESS_TYPE {
    DYNAMIC = 'DYNAMIC',
    ALWAYS = 'ALWAYS',
    DISABLED = 'DISABLED'
}

export enum WAN_FORWARD_TYPE {
    UPNP = 'UPNP',
    STATIC = 'STATIC'
}

export enum DynamicRemoteAccessType {
    STATIC = 'STATIC',
    UPNP = 'UPNP',
    DISABLED = 'DISABLED'
}

@InputType()
export class ConnectUserInfoInput {
    @Field({ description: 'The preferred username of the user' })
    @IsString()
    @IsNotEmpty()
    preferred_username!: string;

    @Field({ description: 'The email address of the user' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @Field({ nullable: true, description: 'The avatar URL of the user' })
    @IsString()
    @IsOptional()
    avatar?: string;
}

@InputType()
export class ConnectSignInInput {
    @Field({ description: 'The API key for authentication' })
    @IsString()
    @IsNotEmpty()
    apiKey!: string;

    @Field({ nullable: true, description: 'The ID token for authentication' })
    @IsString()
    @IsOptional()
    idToken?: string;

    @Field(() => ConnectUserInfoInput, { nullable: true, description: 'User information for the sign-in' })
    @ValidateNested()
    @IsOptional()
    userInfo?: ConnectUserInfoInput;

    @Field({ nullable: true, description: 'The access token for authentication' })
    @IsString()
    @IsOptional()
    accessToken?: string;

    @Field({ nullable: true, description: 'The refresh token for authentication' })
    @IsString()
    @IsOptional()
    refreshToken?: string;
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

    @Field(() => WAN_FORWARD_TYPE, { nullable: true, description: 'The type of port forwarding used for Remote Access' })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE;

    @Field(() => Int, { nullable: true, description: 'The port used for Remote Access' })
    @IsPort()
    @IsOptional()
    port?: number;
}

@InputType()
export class SetupRemoteAccessInput {
    @Field(() => WAN_ACCESS_TYPE, { description: 'The type of WAN access to use for Remote Access' })
    @IsEnum(WAN_ACCESS_TYPE)
    accessType!: WAN_ACCESS_TYPE;

    @Field(() => WAN_FORWARD_TYPE, { nullable: true, description: 'The type of port forwarding to use for Remote Access' })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE;

    @Field(() => Int, { nullable: true, description: 'The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP.' })
    @IsPort()
    @IsOptional()
    port?: number;
}

@InputType()
export class EnableDynamicRemoteAccessInput {
    @Field({ description: 'The URL for dynamic remote access' })
    @IsString()
    @IsNotEmpty()
    url!: string;

    @Field({ description: 'Whether to enable or disable dynamic remote access' })
    @IsBoolean()
    enabled!: boolean;
}

@ObjectType()
export class DynamicRemoteAccessStatus {
    @Field(() => DynamicRemoteAccessType, { description: 'The type of dynamic remote access that is enabled' })
    @IsEnum(DynamicRemoteAccessType)
    enabledType!: DynamicRemoteAccessType;

    @Field(() => DynamicRemoteAccessType, { description: 'The type of dynamic remote access that is currently running' })
    @IsEnum(DynamicRemoteAccessType)
    runningType!: DynamicRemoteAccessType;

    @Field({ nullable: true, description: 'Any error message associated with the dynamic remote access' })
    @IsString()
    @IsOptional()
    error?: string;
}

@ObjectType()
export class ConnectSettingsValues {
    @Field({ description: 'If true, the GraphQL sandbox is enabled and available at /graphql. If false, the GraphQL sandbox is disabled and only the production API will be available.' })
    @IsBoolean()
    sandbox!: boolean;

    @Field(() => [String], { description: 'A list of origins allowed to interact with the API' })
    @IsArray()
    @IsString({ each: true })
    extraOrigins!: string[];

    @Field(() => WAN_ACCESS_TYPE, { description: 'The type of WAN access used for Remote Access' })
    @IsEnum(WAN_ACCESS_TYPE)
    accessType!: WAN_ACCESS_TYPE;

    @Field(() => WAN_FORWARD_TYPE, { nullable: true, description: 'The type of port forwarding used for Remote Access' })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE;

    @Field(() => Int, { nullable: true, description: 'The port used for Remote Access' })
    @IsPort()
    @IsOptional()
    port?: number;

    @Field(() => [String], { description: 'A list of Unique Unraid Account ID\'s' })
    @IsArray()
    @IsString({ each: true })
    ssoUserIds!: string[];
}

@InputType()
export class ApiSettingsInput {
    @Field({ nullable: true, description: 'If true, the GraphQL sandbox will be enabled and available at /graphql. If false, the GraphQL sandbox will be disabled and only the production API will be available.' })
    @IsBoolean()
    @IsOptional()
    sandbox?: boolean;

    @Field(() => [String], { nullable: true, description: 'A list of origins allowed to interact with the API' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    extraOrigins?: string[];

    @Field(() => WAN_ACCESS_TYPE, { nullable: true, description: 'The type of WAN access to use for Remote Access' })
    @IsEnum(WAN_ACCESS_TYPE)
    @IsOptional()
    accessType?: WAN_ACCESS_TYPE;

    @Field(() => WAN_FORWARD_TYPE, { nullable: true, description: 'The type of port forwarding to use for Remote Access' })
    @IsEnum(WAN_FORWARD_TYPE)
    @IsOptional()
    forwardType?: WAN_FORWARD_TYPE;

    @Field(() => Int, { nullable: true, description: 'The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP.' })
    @IsPort()
    @IsOptional()
    port?: number;

    @Field(() => [String], { nullable: true, description: 'A list of Unique Unraid Account ID\'s' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    ssoUserIds?: string[];
}

@ObjectType()
export class ConnectSettings {
    @Field(() => ID, { description: 'The unique identifier for the Connect settings' })
    @IsString()
    @IsNotEmpty()
    id!: string;

    @Field(() => Object, { description: 'The data schema for the Connect settings' })
    @IsObject()
    dataSchema!: Record<string, any>;

    @Field(() => Object, { description: 'The UI schema for the Connect settings' })
    @IsObject()
    uiSchema!: Record<string, any>;

    @Field(() => ConnectSettingsValues, { description: 'The values for the Connect settings' })
    @ValidateNested()
    values!: ConnectSettingsValues;
}

@ObjectType()
export class Connect {
    @Field(() => ID, { description: 'The unique identifier for the Connect instance' })
    @IsString()
    @IsNotEmpty()
    id!: string;

    @Field(() => DynamicRemoteAccessStatus, { description: 'The status of dynamic remote access' })
    @ValidateNested()
    dynamicRemoteAccess!: DynamicRemoteAccessStatus;

    @Field(() => ConnectSettings, { description: 'The settings for the Connect instance' })
    @ValidateNested()
    settings!: ConnectSettings;
}
