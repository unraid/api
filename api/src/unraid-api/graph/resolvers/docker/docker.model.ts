import {
    Field,
    Float,
    GraphQLISODateTime,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { GraphQLBigInt, GraphQLJSON, GraphQLPort } from 'graphql-scalars';

export enum ContainerPortType {
    TCP = 'TCP',
    UDP = 'UDP',
}

registerEnumType(ContainerPortType, {
    name: 'ContainerPortType',
});

@ObjectType()
export class ContainerPort {
    @Field(() => String, { nullable: true })
    ip?: string;

    @Field(() => GraphQLPort, { nullable: true })
    privatePort?: number;

    @Field(() => GraphQLPort, { nullable: true })
    publicPort?: number;

    @Field(() => ContainerPortType)
    type!: ContainerPortType;
}

@ObjectType()
export class DockerPortConflictContainer {
    @Field(() => PrefixedID)
    id!: string;

    @Field(() => String)
    name!: string;
}

@ObjectType()
export class DockerContainerPortConflict {
    @Field(() => GraphQLPort)
    privatePort!: number;

    @Field(() => ContainerPortType)
    type!: ContainerPortType;

    @Field(() => [DockerPortConflictContainer])
    containers!: DockerPortConflictContainer[];
}

@ObjectType()
export class DockerLanPortConflict {
    @Field(() => String)
    lanIpPort!: string;

    @Field(() => GraphQLPort, { nullable: true })
    publicPort?: number;

    @Field(() => ContainerPortType)
    type!: ContainerPortType;

    @Field(() => [DockerPortConflictContainer])
    containers!: DockerPortConflictContainer[];
}

@ObjectType()
export class DockerPortConflicts {
    @Field(() => [DockerContainerPortConflict])
    containerPorts!: DockerContainerPortConflict[];

    @Field(() => [DockerLanPortConflict])
    lanPorts!: DockerLanPortConflict[];
}

export enum ContainerState {
    RUNNING = 'RUNNING',
    PAUSED = 'PAUSED',
    EXITED = 'EXITED',
}

registerEnumType(ContainerState, {
    name: 'ContainerState',
});

@ObjectType()
export class ContainerHostConfig {
    @Field(() => String)
    networkMode!: string;
}

@ObjectType()
export class ContainerMount {
    @Field(() => String)
    type!: string;

    @Field(() => String)
    name!: string;

    @Field(() => String)
    source!: string;

    @Field(() => String)
    destination!: string;

    @Field(() => String)
    driver!: string;

    @Field(() => String)
    mode!: string;

    @Field(() => Boolean)
    rw!: boolean;

    @Field(() => String)
    propagation!: string;
}

@ObjectType({ implements: () => Node })
export class DockerContainer extends Node {
    @Field(() => [String])
    names!: string[];

    @Field(() => String)
    image!: string;

    @Field(() => String)
    imageId!: string;

    @Field(() => String)
    command!: string;

    @Field(() => Int)
    created!: number;

    @Field(() => [ContainerPort])
    ports!: ContainerPort[];

    @Field(() => [String], {
        nullable: true,
        description: 'List of LAN-accessible host:port values',
    })
    lanIpPorts?: string[];

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description: 'Total size of all files in the container (in bytes)',
    })
    sizeRootFs?: number;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description: 'Size of writable layer (in bytes)',
    })
    sizeRw?: number;

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description: 'Size of container logs (in bytes)',
    })
    sizeLog?: number;

    @Field(() => GraphQLJSON, { nullable: true })
    labels?: Record<string, any>;

    @Field(() => ContainerState)
    state!: ContainerState;

    @Field(() => String)
    status!: string;

    @Field(() => ContainerHostConfig, { nullable: true })
    hostConfig?: ContainerHostConfig;

    @Field(() => GraphQLJSON, { nullable: true })
    networkSettings?: Record<string, any>;

    @Field(() => [GraphQLJSON], { nullable: true })
    mounts?: Record<string, any>[];

    @Field(() => Boolean)
    autoStart!: boolean;

    @Field(() => Int, { nullable: true, description: 'Zero-based order in the auto-start list' })
    autoStartOrder?: number;

    @Field(() => Int, { nullable: true, description: 'Wait time in seconds applied after start' })
    autoStartWait?: number;

    @Field(() => String, { nullable: true })
    templatePath?: string;

    @Field(() => String, { nullable: true, description: 'Project/Product homepage URL' })
    projectUrl?: string;

    @Field(() => String, { nullable: true, description: 'Registry/Docker Hub URL' })
    registryUrl?: string;

    @Field(() => String, { nullable: true, description: 'Support page/thread URL' })
    supportUrl?: string;

    @Field(() => String, { nullable: true, description: 'Icon URL' })
    iconUrl?: string;

    @Field(() => String, { nullable: true, description: 'Resolved WebUI URL from template' })
    webUiUrl?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Shell to use for console access (from template)',
    })
    shell?: string;

    @Field(() => [ContainerPort], {
        nullable: true,
        description: 'Port mappings from template (used when container is not running)',
    })
    templatePorts?: ContainerPort[];

    @Field(() => Boolean, { description: 'Whether the container is orphaned (no template found)' })
    isOrphaned!: boolean;
}

@ObjectType({ implements: () => Node })
export class DockerNetwork extends Node {
    @Field(() => String)
    name!: string;

    @Field(() => String)
    created!: string;

    @Field(() => String)
    scope!: string;

    @Field(() => String)
    driver!: string;

    @Field(() => Boolean)
    enableIPv6!: boolean;

    @Field(() => GraphQLJSON)
    ipam!: Record<string, any>;

    @Field(() => Boolean)
    internal!: boolean;

    @Field(() => Boolean)
    attachable!: boolean;

    @Field(() => Boolean)
    ingress!: boolean;

    @Field(() => GraphQLJSON)
    configFrom!: Record<string, any>;

    @Field(() => Boolean)
    configOnly!: boolean;

    @Field(() => GraphQLJSON)
    containers!: Record<string, any>;

    @Field(() => GraphQLJSON)
    options!: Record<string, any>;

    @Field(() => GraphQLJSON)
    labels!: Record<string, any>;
}

@ObjectType()
export class DockerContainerLogLine {
    @Field(() => GraphQLISODateTime)
    timestamp!: Date;

    @Field(() => String)
    message!: string;
}

@ObjectType()
export class DockerContainerLogs {
    @Field(() => PrefixedID)
    containerId!: string;

    @Field(() => [DockerContainerLogLine])
    lines!: DockerContainerLogLine[];

    @Field(() => GraphQLISODateTime, {
        nullable: true,
        description:
            'Cursor that can be passed back through the since argument to continue streaming logs.',
    })
    cursor?: Date | null;
}

@ObjectType()
export class DockerContainerStats {
    @Field(() => PrefixedID)
    id!: string;

    @Field(() => Float, { description: 'CPU Usage Percentage' })
    cpuPercent!: number;

    @Field(() => String, { description: 'Memory Usage String (e.g. 100MB / 1GB)' })
    memUsage!: string;

    @Field(() => Float, { description: 'Memory Usage Percentage' })
    memPercent!: number;

    @Field(() => String, { description: 'Network I/O String (e.g. 100MB / 1GB)' })
    netIO!: string;

    @Field(() => String, { description: 'Block I/O String (e.g. 100MB / 1GB)' })
    blockIO!: string;
}

@ObjectType({ description: 'Tailscale exit node connection status' })
export class TailscaleExitNodeStatus {
    @Field(() => Boolean, { description: 'Whether the exit node is online' })
    online!: boolean;

    @Field(() => [String], { nullable: true, description: 'Tailscale IPs of the exit node' })
    tailscaleIps?: string[];
}

@ObjectType({ description: 'Tailscale status for a Docker container' })
export class TailscaleStatus {
    @Field(() => Boolean, { description: 'Whether Tailscale is online in the container' })
    online!: boolean;

    @Field(() => String, { nullable: true, description: 'Current Tailscale version' })
    version?: string;

    @Field(() => String, { nullable: true, description: 'Latest available Tailscale version' })
    latestVersion?: string;

    @Field(() => Boolean, { description: 'Whether a Tailscale update is available' })
    updateAvailable!: boolean;

    @Field(() => String, { nullable: true, description: 'Configured Tailscale hostname' })
    hostname?: string;

    @Field(() => String, { nullable: true, description: 'Actual Tailscale DNS name' })
    dnsName?: string;

    @Field(() => String, { nullable: true, description: 'DERP relay code' })
    relay?: string;

    @Field(() => String, { nullable: true, description: 'DERP relay region name' })
    relayName?: string;

    @Field(() => [String], { nullable: true, description: 'Tailscale IPv4 and IPv6 addresses' })
    tailscaleIps?: string[];

    @Field(() => [String], { nullable: true, description: 'Advertised subnet routes' })
    primaryRoutes?: string[];

    @Field(() => Boolean, { description: 'Whether this container is an exit node' })
    isExitNode!: boolean;

    @Field(() => TailscaleExitNodeStatus, {
        nullable: true,
        description: 'Status of the connected exit node (if using one)',
    })
    exitNodeStatus?: TailscaleExitNodeStatus;

    @Field(() => String, { nullable: true, description: 'Tailscale Serve/Funnel WebUI URL' })
    webUiUrl?: string;

    @Field(() => GraphQLISODateTime, { nullable: true, description: 'Tailscale key expiry date' })
    keyExpiry?: Date;

    @Field(() => Int, { nullable: true, description: 'Days until key expires' })
    keyExpiryDays?: number;

    @Field(() => Boolean, { description: 'Whether the Tailscale key has expired' })
    keyExpired!: boolean;

    @Field(() => String, {
        nullable: true,
        description: 'Tailscale backend state (Running, NeedsLogin, Stopped, etc.)',
    })
    backendState?: string;

    @Field(() => String, {
        nullable: true,
        description: 'Authentication URL if Tailscale needs login',
    })
    authUrl?: string;
}

@ObjectType({
    implements: () => Node,
})
export class Docker extends Node {
    @Field(() => [DockerContainer])
    containers!: DockerContainer[];

    @Field(() => [DockerNetwork])
    networks!: DockerNetwork[];

    @Field(() => DockerPortConflicts)
    portConflicts!: DockerPortConflicts;

    @Field(() => DockerContainerLogs, {
        description:
            'Access container logs. Requires specifying a target container id through resolver arguments.',
    })
    logs!: DockerContainerLogs;
}

@InputType()
export class DockerAutostartEntryInput {
    @Field(() => PrefixedID, { description: 'Docker container identifier' })
    id!: string;

    @Field(() => Boolean, { description: 'Whether the container should auto-start' })
    autoStart!: boolean;

    @Field(() => Int, {
        nullable: true,
        description: 'Number of seconds to wait after starting the container',
    })
    wait?: number | null;
}
