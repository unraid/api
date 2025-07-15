import { Field, GraphQLISODateTime, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model';

// Moved BackupJobStatus enum here
export enum BackupJobStatus {
    QUEUED = 'Queued',
    RUNNING = 'Running',
    COMPLETED = 'Completed',
    FAILED = 'Failed',
    CANCELLED = 'Cancelled',
}

registerEnumType(BackupJobStatus, {
    name: 'BackupJobStatus',
    description: 'Status of a backup job',
});

@ObjectType({
    implements: () => Node,
})
export class JobStatus extends Node {
    @Field(() => String, { description: 'External job ID from the job execution system' })
    externalJobId!: string;

    @Field()
    name!: string;

    @Field(() => BackupJobStatus)
    status!: BackupJobStatus;

    @Field(() => Int, { description: 'Progress percentage (0-100)' })
    progress!: number;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    error?: string;

    @Field(() => GraphQLISODateTime)
    startTime!: Date;

    @Field(() => GraphQLISODateTime, { nullable: true })
    endTime?: Date;

    @Field(() => Int, { nullable: true, description: 'Bytes transferred' })
    bytesTransferred?: number;

    @Field(() => Int, { nullable: true, description: 'Total bytes to transfer' })
    totalBytes?: number;

    @Field(() => Int, { nullable: true, description: 'Transfer speed in bytes per second' })
    speed?: number;

    @Field(() => Int, { nullable: true, description: 'Elapsed time in seconds' })
    elapsedTime?: number;

    @Field(() => Int, { nullable: true, description: 'Estimated time to completion in seconds' })
    eta?: number;

    @Field(() => String, { nullable: true, description: 'Human-readable bytes transferred' })
    formattedBytesTransferred?: string;

    @Field(() => String, { nullable: true, description: 'Human-readable transfer speed' })
    formattedSpeed?: string;

    @Field(() => String, { nullable: true, description: 'Human-readable elapsed time' })
    formattedElapsedTime?: string;

    @Field(() => String, { nullable: true, description: 'Human-readable ETA' })
    formattedEta?: string;
}

// Use JobStatus as the unified type for both GraphQL and TypeScript
export type JobStatusInfo = JobStatus;
