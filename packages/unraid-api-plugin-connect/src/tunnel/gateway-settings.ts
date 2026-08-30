import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { isIP } from 'node:net';

import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsString,
    Matches,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

@ObjectType()
@InputType('ConnectGatewayServiceInput')
export class ConnectGatewayService {
    @Field(() => String)
    @Matches(/^app-[a-f0-9]{16}$/)
    id!: string;
    @Field(() => String)
    @IsString()
    @MaxLength(80)
    name!: string;
    @Field(() => String)
    @IsString()
    @MaxLength(300)
    upstream!: string;
    @Field(() => String)
    @IsString()
    @MaxLength(253)
    tlsServerName = '';
    @Field(() => Boolean)
    @IsBoolean()
    enabled = false;
    @Field(() => String, { defaultValue: 'account' })
    @IsIn(['account', 'unraid', 'upstream', 'oidc'])
    auth?: 'account' | 'unraid' | 'upstream' | 'oidc' = 'account';
    @Field(() => String, { defaultValue: '' })
    @IsString()
    @MaxLength(128)
    providerId?: string = '';
    @Field(() => [String], { defaultValue: [] })
    @IsArray()
    @ArrayMaxSize(128)
    @IsString({ each: true })
    @MaxLength(256, { each: true })
    subjects?: string[] = [];
}
@InputType()
export class ConnectGatewaySettingsInput {
    @Field(() => Int)
    @IsInt()
    @Min(0)
    expectedRevision!: number;
    @Field(() => [ConnectGatewayService])
    @IsArray()
    @ArrayMaxSize(31)
    @ValidateNested({ each: true })
    @Type(() => ConnectGatewayService)
    services!: ConnectGatewayService[];
}
@ObjectType()
export class ConnectGatewayServiceStatus extends ConnectGatewayService {
    @Field(() => String, { nullable: true })
    url!: string | null;
}
@ObjectType()
export class ConnectGatewaySettings {
    @Field(() => String, { nullable: true })
    callbackUrl!: string | null;
    @Field(() => Int)
    revision!: number;
    @Field(() => Boolean)
    available!: boolean;
    @Field(() => Boolean)
    pending!: boolean;
    @Field(() => [ConnectGatewayServiceStatus])
    services!: ConnectGatewayServiceStatus[];
}
export function validateGatewayServices(services: ConnectGatewayService[]): ConnectGatewayService[] {
    if (!Array.isArray(services) || services.length > 31) throw new Error('Use at most 31 services');
    const seen = new Set<string>();
    return services.map((service) => {
        if (!/^app-[a-f0-9]{16}$/.test(service.id) || seen.has(service.id))
            throw new Error('Invalid or duplicate service ID');
        seen.add(service.id);
        if (
            typeof service.name !== 'string' ||
            !service.name.trim() ||
            service.name.length > 80 ||
            typeof service.enabled !== 'boolean'
        )
            throw new Error('A service needs a name and an enabled state');
        const requestedAuth = service.auth === undefined ? 'account' : service.auth;
        if (
            requestedAuth !== 'account' &&
            requestedAuth !== 'unraid' &&
            requestedAuth !== 'upstream' &&
            requestedAuth !== 'oidc'
        )
            throw new Error('Invalid authentication mode');
        // Core persists its first-party issuer mode as "unraid". Legacy API
        // releases use the Unraid Account issuer for the equivalent route.
        const auth = requestedAuth === 'unraid' ? 'account' : requestedAuth;
        const providerId = service.providerId === undefined ? '' : service.providerId;
        const subjects = service.subjects === undefined ? [] : service.subjects;
        if (
            typeof providerId !== 'string' ||
            providerId.length > 128 ||
            !Array.isArray(subjects) ||
            subjects.length > 128 ||
            subjects.some((s) => typeof s !== 'string' || !s || s.length > 256)
        )
            throw new Error('Invalid provider or service subjects');
        if (auth === 'oidc' ? !providerId : Boolean(providerId || subjects.length))
            throw new Error(
                'Only configured-provider sign-in accepts a provider and subject restrictions'
            );
        const url = new URL(service.upstream);
        const host = url.hostname.replace(/^\[|\]$/g, '');
        const parts = host.split('.').map(Number);
        const privateAddress =
            isIP(host) === 4
                ? parts[0] === 10 ||
                  parts[0] === 127 ||
                  (parts[0] === 192 && parts[1] === 168) ||
                  (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
                : isIP(host) === 6 && (host === '::1' || /^(fc|fd)/i.test(host));
        if (
            !privateAddress ||
            !['http:', 'https:'].includes(url.protocol) ||
            url.username ||
            url.password ||
            url.search ||
            url.hash ||
            url.pathname !== '/' ||
            url.port === '0'
        )
            throw new Error(
                'Use a private or loopback HTTP(S) IP address without credentials, a path, or query parameters'
            );
        const tlsServerName = service.tlsServerName.trim().toLowerCase();
        if (
            tlsServerName &&
            (url.protocol !== 'https:' ||
                tlsServerName.length > 253 ||
                !tlsServerName
                    .split('.')
                    .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
        )
            throw new Error('TLS server name requires HTTPS and a valid hostname');
        return {
            id: service.id,
            name: service.name.trim(),
            upstream: url.origin,
            tlsServerName,
            enabled: service.enabled,
            auth,
            providerId,
            subjects: [...new Set(subjects)],
        };
    });
}
