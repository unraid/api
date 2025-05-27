import { createUnionType, Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import { BackupJobStatus } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';

export enum DestinationType {
    RCLONE = 'rclone',
}

registerEnumType(DestinationType, {
    name: 'DestinationType',
});

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

@InputType()
export class DestinationConfigInput {
    @Field(() => RcloneDestinationConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => RcloneDestinationConfigInput)
    rcloneConfig?: RcloneDestinationConfigInput;
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

export const DestinationConfigInputUnion = DestinationConfigInput;
