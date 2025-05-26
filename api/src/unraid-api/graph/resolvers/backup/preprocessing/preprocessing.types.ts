import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import {
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

export enum PreprocessType {
    NONE = 'none',
    ZFS = 'zfs',
    FLASH = 'flash',
    SCRIPT = 'script',
}

registerEnumType(PreprocessType, {
    name: 'PreprocessType',
    description: 'Type of preprocessing to perform before backup',
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
export class PreprocessConfigInput {
    @Field(() => PreprocessType, { description: 'Type of preprocessing to perform' })
    @IsEnum(PreprocessType)
    type!: PreprocessType;

    @Field(() => ZfsPreprocessConfigInput, { nullable: true })
    @IsOptional()
    @ValidateIf((o) => o.type === PreprocessType.ZFS)
    @ValidateNested()
    @Type(() => ZfsPreprocessConfigInput)
    zfsConfig?: ZfsPreprocessConfigInput;

    @Field(() => FlashPreprocessConfigInput, { nullable: true })
    @IsOptional()
    @ValidateIf((o) => o.type === PreprocessType.FLASH)
    @ValidateNested()
    @Type(() => FlashPreprocessConfigInput)
    flashConfig?: FlashPreprocessConfigInput;

    @Field(() => ScriptPreprocessConfigInput, { nullable: true })
    @IsOptional()
    @ValidateIf((o) => o.type === PreprocessType.SCRIPT)
    @ValidateNested()
    @Type(() => ScriptPreprocessConfigInput)
    scriptConfig?: ScriptPreprocessConfigInput;

    @Field(() => Number, { description: 'Timeout for preprocessing in seconds', defaultValue: 3600 })
    @IsNumber()
    @Min(1)
    timeout!: number;

    @Field(() => Boolean, { description: 'Whether to cleanup on failure', defaultValue: true })
    @IsBoolean()
    cleanupOnFailure!: boolean;
}

@ObjectType()
export class PreprocessConfig {
    @Field(() => PreprocessType)
    type!: PreprocessType;

    @Field(() => ZfsPreprocessConfig, { nullable: true })
    zfsConfig?: ZfsPreprocessConfig;

    @Field(() => FlashPreprocessConfig, { nullable: true })
    flashConfig?: FlashPreprocessConfig;

    @Field(() => ScriptPreprocessConfig, { nullable: true })
    scriptConfig?: ScriptPreprocessConfig;

    @Field(() => Number)
    timeout!: number;

    @Field(() => Boolean)
    cleanupOnFailure!: boolean;
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
    type: PreprocessType;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    error?: string;
}
