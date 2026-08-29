import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';

import { IsBoolean } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import { ConnectGatewaySettings } from './gateway-settings.js';

@InputType()
export class ConnectTunnelSettingsInput {
    @Field(() => Boolean)
    @IsBoolean()
    certificateManagementEnabled!: boolean;

    @Field(() => Boolean)
    @IsBoolean()
    tunnelRemoteAccessEnabled!: boolean;

    @Field(() => Boolean)
    @IsBoolean()
    serverDataReportingEnabled!: boolean;
}

@ObjectType()
export class ConnectTunnelEntitlement {
    @Field(() => String)
    accessState!: string;
    @Field(() => String, { nullable: true })
    reason!: string | null;
    @Field(() => String)
    status!: string;
    @Field(() => Float)
    bytesUsed!: number;
    @Field(() => Float)
    quotaBytes!: number;
    @Field(() => Float)
    periodStart!: number;
    @Field(() => Float)
    periodEnd!: number;
    @Field(() => Float, { nullable: true })
    bytesRemaining!: number | null;
    @Field(() => Float, { nullable: true })
    updatedAt!: number | null;
}

@ObjectType()
export class ConnectTunnelStatus {
    @Field(() => String)
    gateway!: string;
    @Field(() => String)
    gatewayReason!: string;
    @Field(() => String)
    routeState!: string;

    @Field(() => ConnectTunnelEntitlement, { nullable: true })
    entitlement!: ConnectTunnelEntitlement | null;

    @Field(() => String)
    entitlementState!: string;

    @Field(() => String)
    tunnelReason!: string;

    @Field(() => String)
    presence!: string;

    @Field(() => String)
    certificate!: string;

    @Field(() => String)
    tunnel!: string;

    @Field(() => String)
    reason!: string;
}

@ObjectType()
export class ConnectCertificateMigration {
    @Field(() => String, { nullable: true })
    requestId!: string | null;

    @Field(() => String)
    status!: string;

    @Field(() => String)
    reason!: string;

    @Field(() => String, { nullable: true })
    domain!: string | null;

    @Field(() => String, { nullable: true })
    fingerprint!: string | null;

    @Field(() => Boolean)
    managed!: boolean;

    @Field(() => String, { nullable: true })
    confirmationToken!: string | null;
}

@ObjectType()
export class ConnectTunnelSettings {
    @Field(() => ConnectGatewaySettings)
    gateway!: ConnectGatewaySettings;

    @Field(() => Boolean)
    signedIn!: boolean;

    @Field(() => Boolean)
    certificateManagementEnabled!: boolean;

    @Field(() => Boolean)
    tunnelRemoteAccessEnabled!: boolean;

    @Field(() => Boolean)
    serverDataReportingEnabled!: boolean;

    @Field(() => String, { nullable: true })
    tunnelUrl!: string | null;

    @Field(() => ConnectTunnelStatus)
    status!: ConnectTunnelStatus;

    @Field(() => Boolean)
    overviewCleanupPending!: boolean;

    @Field(() => GraphQLJSON)
    overview!: object;

    @Field(() => ConnectCertificateMigration)
    certificateMigration!: ConnectCertificateMigration;
}
