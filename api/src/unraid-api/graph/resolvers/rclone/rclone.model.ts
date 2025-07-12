import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';

import { type Layout } from '@jsonforms/core';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import { BackupJobStatus } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-job-status.model.js';
import { DataSlice } from '@app/unraid-api/types/json-forms.js';

@ObjectType()
export class RCloneDrive {
    @Field(() => String, { description: 'Provider name' })
    name!: string;

    @Field(() => GraphQLJSON, { description: 'Provider options and configuration schema' })
    options!: Record<string, unknown>;
}

/**
 * Raw response format from rclone API
 */
export interface RCloneProviderResponse {
    Name: string;
    Description: string;
    Prefix: string;
    Options: RCloneProviderOptionResponse[];
    CommandHelp?: string | null;
    Aliases?: string[] | null;
    Hide?: boolean;
    MetadataInfo?: Record<string, unknown>;
}

/**
 * Raw option format from rclone API
 */
export interface RCloneProviderOptionResponse {
    Name: string;
    Help: string;
    Provider: string;
    Default?: unknown;
    Value?: unknown;
    ShortOpt?: string;
    Hide?: number;
    Required?: boolean;
    IsPassword?: boolean;
    NoPrefix?: boolean;
    Advanced?: boolean;
    DefaultStr?: string;
    ValueStr?: string;
    Type?: string;
    Examples?: Array<{ Value: string; Help: string; Provider: string }>;
}

/**
 * Complete remote configuration as returned by rclone
 */
export interface RCloneRemoteConfig {
    type: string;
    [key: string]: unknown;
}

@InputType()
export class RCloneConfigFormInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    providerType?: string;

    @Field(() => Boolean, { defaultValue: false, nullable: true })
    @IsOptional()
    @IsBoolean()
    showAdvanced?: boolean;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    parameters?: Record<string, unknown>;
}

@ObjectType()
export class RCloneBackupConfigForm {
    @Field(() => ID)
    id!: string;

    @Field(() => GraphQLJSON)
    dataSchema!: { properties: DataSlice; type: 'object' };

    @Field(() => GraphQLJSON)
    uiSchema!: Layout;
}

@ObjectType()
export class RCloneBackupSettings {
    @Field(() => RCloneBackupConfigForm)
    configForm!: RCloneBackupConfigForm;

    @Field(() => [RCloneDrive])
    drives!: RCloneDrive[];

    @Field(() => [RCloneRemote])
    remotes!: RCloneRemote[];
}

@ObjectType()
export class RCloneRemote {
    @Field(() => String)
    name!: string;

    @Field(() => String)
    type!: string;

    @Field(() => GraphQLJSON)
    parameters!: Record<string, unknown>;

    @Field(() => GraphQLJSON, { description: 'Complete remote configuration' })
    config!: RCloneRemoteConfig;
}

@InputType()
export class CreateRCloneRemoteInput {
    @Field(() => String)
    @IsString()
    name!: string;

    @Field(() => String)
    @IsString()
    type!: string;

    @Field(() => GraphQLJSON)
    @IsObject()
    parameters!: Record<string, unknown>;
}

@InputType()
export class DeleteRCloneRemoteInput {
    @Field(() => String)
    @IsString()
    name!: string;
}

@InputType()
export class RCloneStartBackupInput {
    @Field(() => String)
    @IsString()
    srcPath!: string;

    @Field(() => String)
    @IsString()
    dstPath!: string;

    @Field(() => Boolean, { nullable: true, defaultValue: false })
    @IsOptional()
    @IsBoolean()
    async?: boolean;

    @Field(() => String, {
        nullable: true,
        description: 'Configuration ID for job grouping and identification',
    })
    @IsOptional()
    @IsString()
    configId?: string;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    options?: Record<string, any>;
}

@InputType()
export class CreateRCloneRemoteDto {
    @Field(() => String)
    @IsString()
    name!: string;

    @Field(() => String)
    @IsString()
    type!: string;

    @Field(() => GraphQLJSON)
    @IsObject()
    parameters!: Record<string, any>;
}

@InputType()
export class UpdateRCloneRemoteDto {
    @Field(() => String)
    @IsString()
    name!: string;

    @Field(() => GraphQLJSON)
    @IsObject()
    parameters!: Record<string, any>;
}

@InputType()
export class DeleteRCloneRemoteDto {
    @Field(() => String)
    @IsString()
    name!: string;
}

@InputType()
export class GetRCloneRemoteConfigDto {
    @Field(() => String)
    @IsString()
    name!: string;
}

@InputType()
export class GetRCloneRemoteDetailsDto {
    @Field(() => String)
    @IsString()
    name!: string;
}

@InputType()
export class GetRCloneJobStatusDto {
    @Field(() => String)
    @IsString()
    jobId!: string;
}

@ObjectType()
export class RCloneJobStats {
    @Field(() => Number, { description: 'Bytes transferred', nullable: true })
    bytes?: number;

    @Field(() => Number, { description: 'Transfer speed in bytes/sec', nullable: true })
    speed?: number;

    @Field(() => Number, { description: 'Estimated time to completion in seconds', nullable: true })
    eta?: number;

    @Field(() => Number, { description: 'Elapsed time in seconds', nullable: true })
    elapsedTime?: number;

    @Field(() => Number, { description: 'Progress percentage (0-100)', nullable: true })
    percentage?: number;

    @Field(() => Number, { description: 'Number of checks completed', nullable: true })
    checks?: number;

    @Field(() => Number, { description: 'Number of deletes completed', nullable: true })
    deletes?: number;

    @Field(() => Number, { description: 'Number of errors encountered', nullable: true })
    errors?: number;

    @Field(() => Boolean, { description: 'Whether a fatal error occurred', nullable: true })
    fatalError?: boolean;

    @Field(() => String, { description: 'Last error message', nullable: true })
    lastError?: string;

    @Field(() => Number, { description: 'Number of renames completed', nullable: true })
    renames?: number;

    @Field(() => Boolean, { description: 'Whether there is a retry error', nullable: true })
    retryError?: boolean;

    @Field(() => Number, { description: 'Number of server-side copies', nullable: true })
    serverSideCopies?: number;

    @Field(() => Number, { description: 'Bytes in server-side copies', nullable: true })
    serverSideCopyBytes?: number;

    @Field(() => Number, { description: 'Number of server-side moves', nullable: true })
    serverSideMoves?: number;

    @Field(() => Number, { description: 'Bytes in server-side moves', nullable: true })
    serverSideMoveBytes?: number;

    @Field(() => Number, { description: 'Total bytes to transfer', nullable: true })
    totalBytes?: number;

    @Field(() => Number, { description: 'Total checks to perform', nullable: true })
    totalChecks?: number;

    @Field(() => Number, { description: 'Total transfers to perform', nullable: true })
    totalTransfers?: number;

    @Field(() => Number, { description: 'Time spent transferring in seconds', nullable: true })
    transferTime?: number;

    @Field(() => Number, { description: 'Number of transfers completed', nullable: true })
    transfers?: number;

    @Field(() => GraphQLJSON, { description: 'Currently transferring files', nullable: true })
    transferring?: any[];

    @Field(() => GraphQLJSON, { description: 'Currently checking files', nullable: true })
    checking?: any[];

    // Formatted fields
    @Field(() => String, { description: 'Human-readable bytes transferred', nullable: true })
    formattedBytes?: string;

    @Field(() => String, { description: 'Human-readable transfer speed', nullable: true })
    formattedSpeed?: string;

    @Field(() => String, { description: 'Human-readable elapsed time', nullable: true })
    formattedElapsedTime?: string;

    @Field(() => String, { description: 'Human-readable ETA', nullable: true })
    formattedEta?: string;

    // Computed fields that frontend currently calculates
    @Field(() => Number, {
        description: 'Calculated percentage (fallback when percentage is null)',
        nullable: true,
    })
    calculatedPercentage?: number;

    @Field(() => Boolean, { description: 'Whether the job is actively running', nullable: true })
    isActivelyRunning?: boolean;

    @Field(() => Boolean, { description: 'Whether the job is completed', nullable: true })
    isCompleted?: boolean;

    // Allow additional fields
    [key: string]: any;
}

@ObjectType()
export class RCloneJob {
    @Field(() => PrefixedID, { description: 'Job ID' })
    id!: string;

    @Field(() => String, { description: 'RClone group for the job', nullable: true })
    group?: string;

    @Field(() => RCloneJobStats, { description: 'Job status and statistics', nullable: true })
    stats?: RCloneJobStats;

    @Field(() => Number, { description: 'Progress percentage (0-100)', nullable: true })
    progressPercentage?: number;

    @Field(() => PrefixedID, { description: 'Configuration ID that triggered this job', nullable: true })
    configId?: string;

    @Field(() => BackupJobStatus, { description: 'Current status of the job', nullable: true })
    status?: BackupJobStatus;

    @Field(() => Boolean, { description: 'Whether the job is finished', nullable: true })
    finished?: boolean;

    @Field(() => Boolean, { description: 'Whether the job was successful', nullable: true })
    success?: boolean;

    @Field(() => String, { description: 'Error message if job failed', nullable: true })
    error?: string;

    // Computed fields that frontend currently calculates
    @Field(() => Boolean, { description: 'Whether the job is actively running', nullable: true })
    isRunning?: boolean;

    @Field(() => String, { description: 'Error message for display', nullable: true })
    errorMessage?: string;

    @Field(() => Boolean, { description: 'Whether there is a recent job', nullable: true })
    hasRecentJob?: boolean;
}

@ObjectType()
export class RCloneJobStatusDto {
    @Field(() => Number, { description: 'Job ID' })
    id!: number;

    @Field(() => String, { description: 'RClone group for the job' })
    group!: string;

    @Field(() => Boolean, { description: 'Whether the job is finished' })
    finished!: boolean;

    @Field(() => Boolean, { description: 'Whether the job was successful' })
    success!: boolean;

    @Field(() => String, { description: 'Error message if any' })
    error!: string;

    @Field(() => Number, { description: 'Job duration in seconds' })
    duration!: number;

    @Field(() => String, { description: 'Job start time in ISO format' })
    startTime!: string;

    @Field(() => String, { description: 'Job end time in ISO format' })
    endTime!: string;

    @Field(() => GraphQLJSON, { description: 'Job output data', nullable: true })
    output?: Record<string, any>;
}

// API Response Types (for internal use)
export interface RCloneJobListResponse {
    jobids: (string | number)[];
}

export interface RCloneJobWithStats {
    jobId: string | number;
    stats: RCloneJobStats;
}

export interface RCloneJobsWithStatsResponse {
    jobids: (string | number)[];
    stats: RCloneJobStats[];
}
