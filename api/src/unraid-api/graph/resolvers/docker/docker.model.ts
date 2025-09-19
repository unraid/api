import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { type Layout } from '@jsonforms/core';
import { Node } from '@unraid/shared/graphql.model.js';
import { GraphQLBigInt, GraphQLJSON, GraphQLPort } from 'graphql-scalars';

import { DataSlice } from '@app/unraid-api/types/json-forms.js';

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

    @Field(() => GraphQLBigInt, {
        nullable: true,
        description: 'Total size of all files in the container (in bytes)',
    })
    sizeRootFs?: number;

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

@ObjectType({
    implements: () => Node,
})
export class Docker extends Node {
    @Field(() => [DockerContainer])
    containers!: DockerContainer[];

    @Field(() => [DockerNetwork])
    networks!: DockerNetwork[];
}

@ObjectType()
export class DockerContainerOverviewForm {
    @Field(() => ID)
    id!: string;

    @Field(() => GraphQLJSON)
    dataSchema!: { properties: DataSlice; type: 'object' };

    @Field(() => GraphQLJSON)
    uiSchema!: Layout;

    @Field(() => GraphQLJSON)
    data!: Record<string, any>;
}
