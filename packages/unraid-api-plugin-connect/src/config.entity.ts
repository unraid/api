import { UsePipes, ValidationPipe } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { plainToInstance } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';

import { ConnectConfig } from './config.demo.js';

export enum MinigraphStatus {
    PRE_INIT = 'PRE_INIT',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    PING_FAILURE = 'PING_FAILURE',
    ERROR_RETRYING = 'ERROR_RETRYING',
}

export enum DynamicRemoteAccessType {
    NONE = 'none',
    UPNP = 'upnp',
    MANUAL = 'manual',
}

@ObjectType()
@UsePipes(new ValidationPipe({ transform: true }))
@InputType('MyServersConfigInput')
export class MyServersConfig {
    // Remote Access Configurationx
    @Field(() => String)
    @IsString()
    wanaccess!: string;

    @Field(() => Number)
    @IsNumber()
    wanport!: number;

    @Field(() => Boolean)
    @IsBoolean()
    upnpEnabled!: boolean;

    @Field(() => String)
    @IsString()
    apikey!: string;

    @Field(() => String)
    @IsString()
    localApiKey!: string;

    // User Information
    @Field(() => String)
    @IsEmail()
    email!: string;

    @Field(() => String)
    @IsString()
    username!: string;

    @Field(() => String)
    @IsString()
    avatar!: string;

    @Field(() => String)
    @IsString()
    regWizTime!: string;

    // Authentication Tokens
    @Field(() => String)
    @IsString()
    accesstoken!: string;

    @Field(() => String)
    @IsString()
    idtoken!: string;

    @Field(() => String)
    @IsString()
    refreshtoken!: string;

    // Remote Access Settings
    @Field(() => DynamicRemoteAccessType)
    @IsEnum(DynamicRemoteAccessType)
    dynamicRemoteAccessType!: DynamicRemoteAccessType;

    @Field(() => [String])
    @IsArray()
    @Matches(/^[a-zA-Z0-9-]+$/, {
        each: true,
        message: 'Each SSO ID must be alphanumeric with dashes',
    })
    ssoSubIds!: string[];

    // Connection Status
    // @Field(() => MinigraphStatus)
    // @IsEnum(MinigraphStatus)
    // minigraph!: MinigraphStatus;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    upnpStatus?: string | null;
}

@ObjectType()
@UsePipes(new ValidationPipe({ transform: true }))
export class ConnectionMetadata {
    @Field(() => MinigraphStatus)
    @IsEnum(MinigraphStatus)
    status!: MinigraphStatus;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    error?: string | null;

    @Field(() => Number, { nullable: true })
    @IsNumber()
    @IsOptional()
    lastPing?: number | null;

    @Field(() => Number, { nullable: true })
    @IsNumber()
    @IsOptional()
    selfDisconnectedSince?: number | null;

    @Field(() => Number, { nullable: true })
    @IsNumber()
    @IsOptional()
    timeout?: number | null;

    @Field(() => Number, { nullable: true })
    @IsNumber()
    @IsOptional()
    timeoutStart?: number | null;
}

export const configFeature = registerAs<ConnectConfig>('connect', () => ({
    demo: 'hello.unraider',
    mothership: plainToInstance(ConnectionMetadata, {
        status: MinigraphStatus.PRE_INIT,
    }),
}));
