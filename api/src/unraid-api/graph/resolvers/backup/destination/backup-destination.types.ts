import { createUnionType, Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import { BackupJobStatus } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';

export enum DestinationType {
    RCLONE = 'rclone',
}

export interface StreamingJobInfo {
    jobId: string;
    status: BackupJobStatus;
    progress?: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
}

@ObjectType()
export class RcloneDestinationConfig {
    @Field(() => String)
    type!: 'RCLONE';

    @Field(() => String, { description: 'Remote name from rclone config' })
    remoteName!: string;

    @Field(() => String, { description: 'Destination path on the remote' })
    destinationPath!: string;

    @Field(() => GraphQLJSON, {
        description: 'RClone options (e.g., --transfers, --checkers)',
        nullable: true,
    })
    rcloneOptions?: Record<string, unknown>;
}

@InputType()
export class RcloneDestinationConfigInput {
    @Field(() => String, { defaultValue: 'RCLONE' })
    type!: 'RCLONE';

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    remoteName!: string;

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    destinationPath!: string;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    rcloneOptions?: Record<string, unknown>;
}

export const DestinationConfigUnion = createUnionType({
    name: 'DestinationConfigUnion',
    types: () => [RcloneDestinationConfig] as const,
    resolveType: (value) => {
        if (value.type === 'RCLONE') {
            return RcloneDestinationConfig;
        }
        return undefined;
    },
});

export const DestinationConfigInputUnion = GraphQLJSON;
