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
    @Field({ nullable: true })
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
    @Field()
    networkMode!: string;
}

@ObjectType()
export class ContainerMount {
    @Field()
    type!: string;

    @Field()
    name!: string;

    @Field()
    source!: string;

    @Field()
    destination!: string;

    @Field()
    driver!: string;

    @Field()
    mode!: string;

    @Field()
    rw!: boolean;

    @Field()
    propagation!: string;
}

@ObjectType()
export class DockerContainer {
    @Field(() => ID)
    id!: string;

    @Field(() => [String])
    names!: string[];

    @Field()
    image!: string;

    @Field()
    imageId!: string;

    @Field()
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

    @Field()
    status!: string;

    @Field(() => ContainerHostConfig, { nullable: true })
    hostConfig?: ContainerHostConfig;

    @Field(() => GraphQLJSONObject, { nullable: true })
    networkSettings?: Record<string, any>;

    @Field(() => [GraphQLJSONObject], { nullable: true })
    mounts?: Record<string, any>[];

    @Field()
    autoStart!: boolean;
}

@ObjectType()
export class DockerNetwork {
    @Field()
    name!: string;

    @Field(() => ID)
    id!: string;

    @Field()
    created!: string;

    @Field()
    scope!: string;

    @Field()
    driver!: string;

    @Field()
    enableIPv6!: boolean;

    @Field(() => GraphQLJSONObject)
    ipam!: Record<string, any>;

    @Field()
    internal!: boolean;

    @Field()
    attachable!: boolean;

    @Field()
    ingress!: boolean;

    @Field(() => GraphQLJSONObject)
    configFrom!: Record<string, any>;

    @Field()
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

@ObjectType()
export class DockerMutations {
    @Field(() => DockerContainer, { description: 'Start a container' })
    start!: DockerContainer;

    @Field(() => DockerContainer, { description: 'Stop a container' })
    stop!: DockerContainer;
}

