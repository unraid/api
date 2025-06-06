import { Field, InterfaceType, registerEnumType } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

import { PrefixedID } from './prefixed-id-scalar.js';
import { AuthActionVerb } from 'nest-authz';

// Register enums
export enum Resource {
    ACTIVATION_CODE = 'ACTIVATION_CODE',
    API_KEY = 'API_KEY',
    ARRAY = 'ARRAY',
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
    USER = 'USER',
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

export interface ApiKey {
    id: string;
    name: string;
    description?: string;
    roles?: Role[];
    permissions?: Permission[];
    createdAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
    key: string;
}

export interface Permission {
    resource: Resource;
    actions: AuthActionVerb[];
}
