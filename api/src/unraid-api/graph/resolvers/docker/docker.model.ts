import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { GraphQLJSONObject } from 'graphql-type-json';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

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

    @Field(() => Int)
    privatePort!: number;

    @Field(() => Int)
    publicPort!: number;

    @Field(() => ContainerPortType)
    type!: ContainerPortType;
}

export enum ContainerState {
    RUNNING = 'RUNNING',
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

@ObjectType()
export class DockerContainer {
    @Field(() => ID)
    id!: string;

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

    @Field(() => Int, { nullable: true, description: 'Total size of all the files in the container' })
    sizeRootFs?: number;

    @Field(() => GraphQLJSONObject, { nullable: true })
    labels?: Record<string, any>;

    @Field(() => ContainerState)
    state!: ContainerState;

    @Field(() => String)
    status!: string;

    @Field(() => ContainerHostConfig, { nullable: true })
    hostConfig?: ContainerHostConfig;

    @Field(() => GraphQLJSONObject, { nullable: true })
    networkSettings?: Record<string, any>;

    @Field(() => [GraphQLJSONObject], { nullable: true })
    mounts?: Record<string, any>[];

    @Field(() => Boolean)
    autoStart!: boolean;
}

@ObjectType()
export class DockerNetwork {
    @Field(() => String)
    name!: string;

    @Field(() => ID)
    id!: string;

    @Field(() => String)
    created!: string;

    @Field(() => String)
    scope!: string;

    @Field(() => String)
    driver!: string;

    @Field(() => Boolean)
    enableIPv6!: boolean;

    @Field(() => GraphQLJSONObject)
    ipam!: Record<string, any>;

    @Field(() => Boolean)
    internal!: boolean;

    @Field(() => Boolean)
    attachable!: boolean;

    @Field(() => Boolean)
    ingress!: boolean;

    @Field(() => GraphQLJSONObject)
    configFrom!: Record<string, any>;

    @Field(() => Boolean)
    configOnly!: boolean;

    @Field(() => GraphQLJSONObject)
    containers!: Record<string, any>;

    @Field(() => GraphQLJSONObject)
    options!: Record<string, any>;

    @Field(() => GraphQLJSONObject)
    labels!: Record<string, any>;
}

@ObjectType()
export class Docker implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => [DockerContainer])
    containers!: DockerContainer[];

    @Field(() => [DockerNetwork])
    networks!: DockerNetwork[];
}
