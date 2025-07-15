import { createUnionType, Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import { BackupJobStatus } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';

export enum DestinationType {
    RCLONE = 'RCLONE',
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

    static isTypeOf(obj: any): obj is RcloneDestinationConfig {
        return (
            obj &&
            obj.type === 'RCLONE' &&
            typeof obj.remoteName === 'string' &&
            typeof obj.destinationPath === 'string'
        );
    }
}

@InputType()
export class RcloneDestinationConfigInput {
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
    @Field(() => DestinationType, { nullable: false })
    @IsEnum(DestinationType, { message: 'Invalid destination type' })
    type!: DestinationType;

    @Field(() => RcloneDestinationConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => RcloneDestinationConfigInput)
    rcloneConfig?: RcloneDestinationConfigInput;
}

export const DestinationConfigUnion = createUnionType({
    name: 'DestinationConfigUnion',
    types: () => [RcloneDestinationConfig] as const,
    resolveType(obj: any) {
        if (RcloneDestinationConfig.isTypeOf && RcloneDestinationConfig.isTypeOf(obj)) {
            return RcloneDestinationConfig;
        }
        return null;
    },
});

export const DestinationConfigInputUnion = DestinationConfigInput;
