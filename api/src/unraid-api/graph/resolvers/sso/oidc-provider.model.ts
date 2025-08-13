import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';

export enum AuthorizationOperator {
    EQUALS = 'equals',
    CONTAINS = 'contains',
    ENDS_WITH = 'endsWith',
    STARTS_WITH = 'startsWith',
}

export enum AuthorizationRuleMode {
    OR = 'or',
    AND = 'and',
}

registerEnumType(AuthorizationOperator, {
    name: 'AuthorizationOperator',
    description: 'Operators for authorization rule matching',
});

registerEnumType(AuthorizationRuleMode, {
    name: 'AuthorizationRuleMode',
    description:
        'Mode for evaluating authorization rules - OR (any rule passes) or AND (all rules must pass)',
});

@ObjectType()
export class OidcAuthorizationRule {
    @Field(() => String, { description: 'The claim to check (e.g., email, sub, groups, hd)' })
    @IsString()
    @IsNotEmpty()
    claim!: string;

    @Field(() => AuthorizationOperator, { description: 'The comparison operator' })
    @IsEnum(AuthorizationOperator)
    operator!: AuthorizationOperator;

    @Field(() => [String], { description: 'The value(s) to match against' })
    @IsArray()
    @IsString({ each: true })
    value!: string[];
}

@InputType()
export class OidcAuthorizationRuleInput {
    @Field(() => String, { description: 'The claim to check (e.g., email, sub, groups, hd)' })
    @IsString()
    @IsNotEmpty()
    claim!: string;

    @Field(() => AuthorizationOperator, { description: 'The comparison operator' })
    @IsEnum(AuthorizationOperator)
    operator!: AuthorizationOperator;

    @Field(() => [String], { description: 'The value(s) to match against' })
    @IsArray()
    @IsString({ each: true })
    value!: string[];
}

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

    @Field(() => [OidcAuthorizationRule], {
        nullable: true,
        description: 'Flexible authorization rules based on claims',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OidcAuthorizationRule)
    @IsOptional()
    authorizationRules?: OidcAuthorizationRule[];

    @Field(() => AuthorizationRuleMode, {
        nullable: true,
        description:
            'Mode for evaluating authorization rules - OR (any rule passes) or AND (all rules must pass). Defaults to OR.',
        defaultValue: AuthorizationRuleMode.OR,
    })
    @IsEnum(AuthorizationRuleMode)
    @IsOptional()
    authorizationRuleMode?: AuthorizationRuleMode;

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

    @Field(() => String, {
        nullable: true,
        description: 'Button variant style from Reka UI. See https://reka-ui.com/docs/components/button',
    })
    @IsString()
    @IsOptional()
    buttonVariant?: string;

    @Field(() => String, {
        nullable: true,
        description:
            'Custom CSS styles for the button (e.g., "background: linear-gradient(to right, #4f46e5, #7c3aed); border-radius: 9999px;")',
    })
    @IsString()
    @IsOptional()
    buttonStyle?: string;

    @Field(() => Boolean, {
        nullable: true,
        description:
            'Use custom parameter names for authorization (e.g., callbackUrl instead of redirect_uri)',
    })
    @IsBoolean()
    @IsOptional()
    customAuthParams?: boolean;
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

    @Field(() => [OidcAuthorizationRuleInput], {
        nullable: true,
        description: 'Flexible authorization rules based on claims',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OidcAuthorizationRuleInput)
    @IsOptional()
    authorizationRules?: OidcAuthorizationRuleInput[];

    @Field(() => AuthorizationRuleMode, {
        nullable: true,
        description:
            'Mode for evaluating authorization rules - OR (any rule passes) or AND (all rules must pass). Defaults to OR.',
        defaultValue: AuthorizationRuleMode.OR,
    })
    @IsEnum(AuthorizationRuleMode)
    @IsOptional()
    authorizationRuleMode?: AuthorizationRuleMode;

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

    @Field(() => String, {
        nullable: true,
        description: 'Button variant style from Reka UI. See https://reka-ui.com/docs/components/button',
    })
    @IsString()
    @IsOptional()
    buttonVariant?: string;

    @Field(() => String, {
        nullable: true,
        description:
            'Custom CSS styles for the button (e.g., "background: linear-gradient(to right, #4f46e5, #7c3aed); border-radius: 9999px;")',
    })
    @IsString()
    @IsOptional()
    buttonStyle?: string;

    @Field(() => Boolean, {
        nullable: true,
        description:
            'Use custom parameter names for authorization (e.g., callbackUrl instead of redirect_uri)',
    })
    @IsBoolean()
    @IsOptional()
    customAuthParams?: boolean;
}
