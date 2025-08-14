import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

import { PrefixedID } from '@unraid/shared/prefixed-id-scalar';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

@ObjectType()
export class OidcProvider {
    @Field(() => PrefixedID, { description: 'The unique identifier for the OIDC provider' })
    @IsString()
    @IsNotEmpty()
    id!: string;

    @Field(() => String, { description: 'Display name of the OIDC provider' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @Field(() => String, { description: 'OAuth2 client ID registered with the provider' })
    @IsString()
    @IsNotEmpty()
    clientId!: string;

    @Field(() => String, {
        nullable: true,
        description: 'OAuth2 client secret (if required by provider)',
    })
    @IsString()
    @IsOptional()
    clientSecret?: string;

    @Field(() => String, {
        description:
            'OIDC issuer URL (e.g., https://accounts.google.com). Required for auto-discovery via /.well-known/openid-configuration',
    })
    @IsUrl()
    issuer!: string;

    @Field(() => String, {
        nullable: true,
        description:
            'OAuth2 authorization endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration',
    })
    @IsUrl()
    @IsOptional()
    authorizationEndpoint?: string;

    @Field(() => String, {
        nullable: true,
        description:
            'OAuth2 token endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration',
    })
    @IsUrl()
    @IsOptional()
    tokenEndpoint?: string;

    @Field(() => String, {
        nullable: true,
        description:
            'JSON Web Key Set URI for token validation. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration',
    })
    @IsUrl()
    @IsOptional()
    jwksUri?: string;

    @Field(() => [String], { description: 'OAuth2 scopes to request (e.g., openid, profile, email)' })
    @IsArray()
    @IsString({ each: true })
    scopes!: string[];

    @Field(() => [String], { description: 'List of authorized subject IDs allowed to authenticate' })
    @IsArray()
    @IsString({ each: true })
    authorizedSubIds!: string[];

    @Field(() => String, { nullable: true, description: 'Custom text for the login button' })
    @IsString()
    @IsOptional()
    buttonText?: string;

    @Field(() => String, {
        nullable: true,
        description: 'URL or base64 encoded icon for the login button',
    })
    @IsString()
    @IsOptional()
    buttonIcon?: string;
}

@InputType()
export class OidcProviderInput {
    @Field(() => String, { description: 'The unique identifier for the OIDC provider' })
    @IsString()
    @IsNotEmpty()
    id!: string;

    @Field(() => String, { description: 'Display name of the OIDC provider' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @Field(() => String, { description: 'OAuth2 client ID registered with the provider' })
    @IsString()
    @IsNotEmpty()
    clientId!: string;

    @Field(() => String, {
        nullable: true,
        description: 'OAuth2 client secret (if required by provider)',
    })
    @IsString()
    @IsOptional()
    clientSecret?: string;

    @Field(() => String, {
        description:
            'OIDC issuer URL (e.g., https://accounts.google.com). Required for auto-discovery via /.well-known/openid-configuration',
    })
    @IsUrl()
    issuer!: string;

    @Field(() => String, {
        nullable: true,
        description:
            'OAuth2 authorization endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration',
    })
    @IsUrl()
    @IsOptional()
    authorizationEndpoint?: string;

    @Field(() => String, {
        nullable: true,
        description:
            'OAuth2 token endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration',
    })
    @IsUrl()
    @IsOptional()
    tokenEndpoint?: string;

    @Field(() => String, {
        nullable: true,
        description:
            'JSON Web Key Set URI for token validation. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration',
    })
    @IsUrl()
    @IsOptional()
    jwksUri?: string;

    @Field(() => [String], { description: 'OAuth2 scopes to request (e.g., openid, profile, email)' })
    @IsArray()
    @IsString({ each: true })
    scopes!: string[];

    @Field(() => [String], { description: 'List of authorized subject IDs allowed to authenticate' })
    @IsArray()
    @IsString({ each: true })
    authorizedSubIds!: string[];

    @Field(() => String, { nullable: true, description: 'Custom text for the login button' })
    @IsString()
    @IsOptional()
    buttonText?: string;

    @Field(() => String, {
        nullable: true,
        description: 'URL or base64 encoded icon for the login button',
    })
    @IsString()
    @IsOptional()
    buttonIcon?: string;
}
