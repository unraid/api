import { registerEnumType } from '@nestjs/graphql';

// Register enums
export enum Resource {
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
    CONNECT = 'CONNECT',
    GUEST = 'GUEST',
}

registerEnumType(Resource, {
    name: 'Resource',
    description: 'Available resources for permissions',
});

registerEnumType(Role, {
    name: 'Role',
    description: 'Available roles for API keys and users',
});
