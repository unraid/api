import { UsePipes, ValidationPipe } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { URL_TYPE } from '@unraid/shared/network.model.js';
import { plainToInstance, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Matches,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';

import { ConnectGatewayService } from '../tunnel/gateway-settings.js';

export enum MinigraphStatus {
    PRE_INIT = 'PRE_INIT',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    PING_FAILURE = 'PING_FAILURE',
    ERROR_RETRYING = 'ERROR_RETRYING',
}

export enum DynamicRemoteAccessType {
    STATIC = 'STATIC',
    UPNP = 'UPNP',
    DISABLED = 'DISABLED',
}

@ObjectType()
@UsePipes(new ValidationPipe({ transform: true }))
@InputType('MyServersConfigInput')
export class MyServersConfig {
    @IsArray()
    @ArrayMaxSize(31)
    @ValidateNested({ each: true })
    @Type(() => ConnectGatewayService)
    gatewayServices: ConnectGatewayService[] = [];
    @IsInt()
    @Min(0)
    gatewayServicesRevision = 0;
    @IsBoolean()
    gatewayServicesPending = false;
    @IsObject()
    gatewayServiceRoutes: Record<string, string> = {};

    @Field(() => Boolean)
    @IsBoolean()
    certificateManagementEnabled = false;

    @Field(() => Boolean)
    @IsBoolean()
    tunnelRemoteAccessEnabled = false;

    @Field(() => Boolean)
    @IsBoolean()
    serverDataReportingEnabled = false;

    @Field(() => Boolean)
    @IsBoolean()
    serverDataRemoteCleared = false;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    tunnelHostname: string | null = null;

    @Field(() => [String])
    @IsArray()
    @IsString({ each: true })
    tunnelHostnames: string[] = [];

    // Remote Access Configurationx
    @Field(() => Boolean)
    @IsBoolean()
    wanaccess!: boolean;

    @Field(() => Number, { nullable: true })
    @IsNumber()
    @IsOptional()
    wanport?: number | null;

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
    @Field(() => String, { nullable: true })
    @IsOptional()
    @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
    @IsEmail()
    email?: string | null;

    @Field(() => String)
    @IsString()
    username!: string;

    @Field(() => String)
    @IsString()
    avatar!: string;

    @Field(() => String)
    @IsString()
    regWizTime!: string;

    // Remote Access Settings
    @Field(() => DynamicRemoteAccessType)
    @IsEnum(DynamicRemoteAccessType)
    dynamicRemoteAccessType!: DynamicRemoteAccessType;

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

@ObjectType()
@InputType('AccessUrlObjectInput')
export class AccessUrlObject {
    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    ipv4!: string | null | undefined;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    ipv6!: string | null | undefined;

    @Field(() => URL_TYPE)
    @IsEnum(URL_TYPE)
    type!: URL_TYPE;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    name!: string | null | undefined;
}

@ObjectType()
@UsePipes(new ValidationPipe({ transform: true }))
@InputType('DynamicRemoteAccessStateInput')
export class DynamicRemoteAccessState {
    @Field(() => DynamicRemoteAccessType)
    @IsEnum(DynamicRemoteAccessType)
    runningType!: DynamicRemoteAccessType;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    error!: string | null;

    @Field(() => Number, { nullable: true })
    @IsNumber()
    @IsOptional()
    lastPing!: number | null;

    @Field(() => AccessUrlObject, { nullable: true })
    @IsOptional()
    allowedUrl!: AccessUrlObject | null;
}

export const makeDisabledDynamicRemoteAccessState = (): DynamicRemoteAccessState =>
    plainToInstance(DynamicRemoteAccessState, {
        runningType: DynamicRemoteAccessType.DISABLED,
        error: null,
        lastPing: null,
        allowedUrl: null,
    });

export type ConnectConfig = {
    dynamicRemoteAccess: DynamicRemoteAccessState;
    config: MyServersConfig;
};

export type ConfigType = ConnectConfig & {
    connect: ConnectConfig;
    store: any;
} & Record<string, string>;

export const emptyMyServersConfig = (): MyServersConfig => ({
    gatewayServices: [],
    gatewayServicesRevision: 0,
    gatewayServicesPending: false,
    gatewayServiceRoutes: {},
    certificateManagementEnabled: false,
    tunnelRemoteAccessEnabled: false,
    serverDataReportingEnabled: false,
    serverDataRemoteCleared: false,
    tunnelHostname: null,
    tunnelHostnames: [],
    wanaccess: false,
    wanport: 0,
    upnpEnabled: false,
    apikey: '',
    localApiKey: '',
    username: '',
    avatar: '',
    regWizTime: '',
    dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
});

export const configFeature = registerAs<ConnectConfig>('connect', () => ({
    dynamicRemoteAccess: makeDisabledDynamicRemoteAccessState(),
    config: plainToInstance(MyServersConfig, emptyMyServersConfig()),
}));
