import { Field, Float, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';

export enum DockerUpdateEventType {
    STARTED = 'STARTED',
    LAYER_DOWNLOADING = 'LAYER_DOWNLOADING',
    LAYER_EXTRACTING = 'LAYER_EXTRACTING',
    LAYER_COMPLETE = 'LAYER_COMPLETE',
    LAYER_ALREADY_EXISTS = 'LAYER_ALREADY_EXISTS',
    PULLING = 'PULLING',
    LOG = 'LOG',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR',
}

registerEnumType(DockerUpdateEventType, {
    name: 'DockerUpdateEventType',
    description: 'Type of Docker update progress event',
});

@ObjectType({ description: 'Progress information for a single image layer' })
export class DockerLayerProgress {
    @Field(() => String, { description: 'Layer ID (short hash)' })
    layerId!: string;

    @Field(() => String, { description: 'Current status of the layer' })
    status!: string;

    @Field(() => Float, { nullable: true, description: 'Download/extract progress percentage (0-100)' })
    progress?: number;

    @Field(() => Int, { nullable: true, description: 'Bytes downloaded/processed' })
    current?: number;

    @Field(() => Int, { nullable: true, description: 'Total bytes for this layer' })
    total?: number;
}

@ObjectType({ description: 'Real-time progress update for a Docker container update operation' })
export class DockerUpdateProgress {
    @Field(() => PrefixedID, { description: 'Container ID being updated' })
    containerId!: string;

    @Field(() => String, { description: 'Container name being updated' })
    containerName!: string;

    @Field(() => DockerUpdateEventType, { description: 'Type of progress event' })
    type!: DockerUpdateEventType;

    @Field(() => String, { nullable: true, description: 'Human-readable message or log line' })
    message?: string;

    @Field(() => String, { nullable: true, description: 'Layer ID for layer-specific events' })
    layerId?: string;

    @Field(() => Float, {
        nullable: true,
        description: 'Overall progress percentage (0-100) for the current operation',
    })
    overallProgress?: number;

    @Field(() => [DockerLayerProgress], {
        nullable: true,
        description: 'Per-layer progress details',
    })
    layers?: DockerLayerProgress[];

    @Field(() => String, { nullable: true, description: 'Error message if type is ERROR' })
    error?: string;
}
