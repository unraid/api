import { Field, ID, ObjectType, registerEnumType, Scalar } from '@nestjs/graphql';
import { ValueNode } from 'graphql';
import { GraphQLScalarType } from 'graphql';





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

@ObjectType()
export class Node {
    @Field(() => ID)
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

@Scalar('DateTime')
export class DateTimeScalar extends GraphQLScalarType {
    constructor() {
        super({
            name: 'DateTime',
            description: 'Date custom scalar type',
            serialize(value: unknown): string {
                if (value instanceof Date) {
                    return value.toISOString();
                }
                throw new Error('DateTime scalar can only serialize Date objects');
            },
            parseValue(value: unknown): Date {
                if (typeof value === 'string') {
                    return new Date(value);
                }
                throw new Error('DateTime scalar can only parse string values');
            },
            parseLiteral(ast: ValueNode): Date | null {
                if (ast.kind === 'StringValue') {
                    return new Date(ast.value);
                }
                return null;
            },
        });
    }
}