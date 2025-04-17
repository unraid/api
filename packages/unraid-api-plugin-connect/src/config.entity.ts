import { registerAs } from "@nestjs/config";
import { Field, ObjectType, InputType } from "@nestjs/graphql";
import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  Matches,
  IsBoolean,
  IsNumber,
  IsArray,
} from "class-validator";
import { ConnectConfig } from "./config.demo.js";
import { UsePipes, ValidationPipe } from "@nestjs/common";

export enum MinigraphStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  UNKNOWN = "unknown",
}

export enum DynamicRemoteAccessType {
  NONE = "none",
  UPNP = "upnp",
  MANUAL = "manual",
}

@ObjectType()
@UsePipes(new ValidationPipe({ transform: true }))
@InputType("MyServersConfigInput")
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
    message: "Each SSO ID must be alphanumeric with dashes",
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

export const configFeature = registerAs<ConnectConfig>("connect", () => ({
  demo: "hello.unraider",
}));
