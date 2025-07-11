import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GraphQLURL } from 'graphql-scalars';

export enum URL_TYPE {
    LAN = 'LAN',
    WIREGUARD = 'WIREGUARD',
    WAN = 'WAN',
    MDNS = 'MDNS',
    OTHER = 'OTHER',
    DEFAULT = 'DEFAULT',
}

registerEnumType(URL_TYPE, {
    name: 'URL_TYPE',
});

/**
 * This defines the LOCAL server Access URLs - these are sent to Connect if needed to share access routes
 */
@ObjectType()
export class AccessUrl {
    @Field(() => URL_TYPE)
    @IsEnum(URL_TYPE)
    type!: URL_TYPE;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    name?: string | null;

    @Field(() => GraphQLURL, { nullable: true })
    @IsOptional()
    ipv4?: URL | null;

    @Field(() => GraphQLURL, { nullable: true })
    @IsOptional()
    ipv6?: URL | null;
}
