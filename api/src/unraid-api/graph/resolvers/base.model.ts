import { Field, InterfaceType, registerEnumType } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

// Register enums
export enum Resource {
    ACTIVATION_CODE = 'ACTIVATION_CODE',
    API_KEY = 'API_KEY',
    ARRAY = 'ARRAY',
    BACKUP = 'BACKUP',
    CLOUD = 'CLOUD',
    CONFIG = 'CONFIG',
    CONNECT = 'CONNECT',
    CONNECT__REMOTE_ACCESS = 'CONNECT__REMOTE_ACCESS',
    CUSTOMIZATIONS = 'CUSTOMIZATIONS',
    DASHBOARD = 'DASHBOARD',
    DISK = 'DISK',
    DISPLAY = 'DISPLAY',
    DOCKER = 'DOCKER',
    FLASH = 'FLASH',
    INFO = 'INFO',
    LOGS = 'LOGS',
    ME = 'ME',
    NETWORK = 'NETWORK',
    NOTIFICATIONS = 'NOTIFICATIONS',
    ONLINE = 'ONLINE',
    OS = 'OS',
    OWNER = 'OWNER',
    PERMISSION = 'PERMISSION',
    REGISTRATION = 'REGISTRATION',
    SERVERS = 'SERVERS',
    SERVICES = 'SERVICES',
    SHARE = 'SHARE',
    VARS = 'VARS',
    VMS = 'VMS',
    WELCOME = 'WELCOME',
}

export enum Role {
    ADMIN = 'ADMIN',
    CONNECT = 'CONNECT',
    GUEST = 'GUEST',
}

@InterfaceType()
export class Node {
    @Field(() => PrefixedID)
    @IsString()
    @IsNotEmpty()
    id!: string;
}

registerEnumType(Resource, {
    name: 'Resource',
    description: 'Available resources for permissions',
});

registerEnumType(Role, {
    name: 'Role',
    description: 'Available roles for API keys and users',
});
