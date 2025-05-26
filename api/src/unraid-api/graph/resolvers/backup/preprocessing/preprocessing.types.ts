import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

export enum BackupType {
    ZFS = 'ZFS',
    FLASH = 'FLASH',
    SCRIPT = 'SCRIPT',
    RAW = 'RAW',
}

registerEnumType(BackupType, {
    name: 'BackupType',
    description:
        'Type of backup to perform (ZFS snapshot, Flash backup, Custom script, or Raw file backup)',
});

@InputType()
export class ZfsPreprocessConfigInput {
    @Field(() => String, { description: 'ZFS pool name' })
    @IsString()
    @IsNotEmpty()
    poolName!: string;

    @Field(() => String, { description: 'Dataset name within the pool' })
    @IsString()
    @IsNotEmpty()
    datasetName!: string;

    @Field(() => String, { description: 'Snapshot name prefix', nullable: true })
    @IsOptional()
    @IsString()
    snapshotPrefix?: string;

    @Field(() => Boolean, {
        description: 'Whether to cleanup snapshots after backup',
        defaultValue: true,
    })
    @IsBoolean()
    cleanupSnapshots!: boolean;

    @Field(() => Number, { description: 'Number of snapshots to retain', nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(1)
    retainSnapshots?: number;
}

@ObjectType()
export class ZfsPreprocessConfig {
    @Field(() => String)
    poolName!: string;

    @Field(() => String)
    datasetName!: string;

    @Field(() => String, { nullable: true })
    snapshotPrefix?: string;

    @Field(() => Boolean)
    cleanupSnapshots!: boolean;

    @Field(() => Number, { nullable: true })
    retainSnapshots?: number;
}

@InputType()
export class FlashPreprocessConfigInput {
    @Field(() => String, { description: 'Flash drive mount path', defaultValue: '/boot' })
    @IsString()
    @IsNotEmpty()
    flashPath!: string;

    @Field(() => Boolean, { description: 'Whether to include git history', defaultValue: true })
    @IsBoolean()
    includeGitHistory!: boolean;

    @Field(() => [String], { description: 'Additional paths to include in backup', nullable: true })
    @IsOptional()
    additionalPaths?: string[];
}

@ObjectType()
export class FlashPreprocessConfig {
    @Field(() => String)
    flashPath!: string;

    @Field(() => Boolean)
    includeGitHistory!: boolean;

    @Field(() => [String], { nullable: true })
    additionalPaths?: string[];
}

@InputType()
export class ScriptPreprocessConfigInput {
    @Field(() => String, { description: 'Path to the script file' })
    @IsString()
    @IsNotEmpty()
    scriptPath!: string;

    @Field(() => [String], { description: 'Arguments to pass to the script', nullable: true })
    @IsOptional()
    scriptArgs?: string[];

    @Field(() => String, { description: 'Working directory for script execution', nullable: true })
    @IsOptional()
    @IsString()
    workingDirectory?: string;

    @Field(() => GraphQLJSON, {
        description: 'Environment variables for script execution',
        nullable: true,
    })
    @IsOptional()
    environment?: Record<string, string>;

    @Field(() => String, { description: 'Output file path where script should write data' })
    @IsString()
    @IsNotEmpty()
    outputPath!: string;
}

@ObjectType()
export class ScriptPreprocessConfig {
    @Field(() => String)
    scriptPath!: string;

    @Field(() => [String], { nullable: true })
    scriptArgs?: string[];

    @Field(() => String, { nullable: true })
    workingDirectory?: string;

    @Field(() => GraphQLJSON, { nullable: true })
    environment?: Record<string, string>;

    @Field(() => String)
    outputPath!: string;
}

@InputType()
export class RawBackupConfigInput {
    @Field(() => String, { description: 'Source path to backup' })
    @IsString()
    @IsNotEmpty()
    sourcePath!: string;

    @Field(() => [String], { description: 'File patterns to exclude from backup', nullable: true })
    @IsOptional()
    @IsArray()
    excludePatterns?: string[];

    @Field(() => [String], { description: 'File patterns to include in backup', nullable: true })
    @IsOptional()
    @IsArray()
    includePatterns?: string[];
}

@ObjectType()
export class RawBackupConfig {
    @Field(() => String)
    sourcePath!: string;

    @Field(() => [String], { nullable: true })
    excludePatterns?: string[];

    @Field(() => [String], { nullable: true })
    includePatterns?: string[];
}

@InputType()
export class BackupConfigInput {
    @Field(() => Number, { description: 'Timeout for backup operation in seconds', defaultValue: 3600 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    timeout?: number;

    @Field(() => Boolean, { description: 'Whether to cleanup on failure', defaultValue: true })
    @IsOptional()
    @IsBoolean()
    cleanupOnFailure?: boolean;

    @Field(() => ZfsPreprocessConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => ZfsPreprocessConfigInput)
    zfsConfig?: ZfsPreprocessConfigInput;

    @Field(() => FlashPreprocessConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => FlashPreprocessConfigInput)
    flashConfig?: FlashPreprocessConfigInput;

    @Field(() => ScriptPreprocessConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => ScriptPreprocessConfigInput)
    scriptConfig?: ScriptPreprocessConfigInput;

    @Field(() => RawBackupConfigInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => RawBackupConfigInput)
    rawConfig?: RawBackupConfigInput;
}

@ObjectType()
export class BackupConfig {
    @Field(() => Number)
    timeout!: number;

    @Field(() => Boolean)
    cleanupOnFailure!: boolean;

    @Field(() => ZfsPreprocessConfig, { nullable: true })
    zfsConfig?: ZfsPreprocessConfig;

    @Field(() => FlashPreprocessConfig, { nullable: true })
    flashConfig?: FlashPreprocessConfig;

    @Field(() => ScriptPreprocessConfig, { nullable: true })
    scriptConfig?: ScriptPreprocessConfig;

    @Field(() => RawBackupConfig, { nullable: true })
    rawConfig?: RawBackupConfig;
}

export interface PreprocessResult {
    success: boolean;
    streamPath?: string;
    outputPath?: string;
    snapshotName?: string;
    error?: string;
    cleanupRequired?: boolean;
    metadata?: Record<string, unknown>;
}

export interface StreamingJobInfo {
    jobId: string;
    processId: number;
    startTime: Date;
    type: BackupType;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    error?: string;
}

// Type aliases for backward compatibility
export type PreprocessType = BackupType;
export const PreprocessType = BackupType;
export type PreprocessConfig = BackupConfig;
export type PreprocessConfigInput = BackupConfigInput;
