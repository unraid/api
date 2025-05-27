import { Field, GraphQLISODateTime, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

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

    @Field(() => Int)
    progress!: number;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    error?: string;

    @Field(() => GraphQLISODateTime)
    startTime!: Date;

    @Field(() => GraphQLISODateTime, { nullable: true })
    endTime?: Date;
}

// Use JobStatus as the unified type for both GraphQL and TypeScript
export type JobStatusInfo = JobStatus;
