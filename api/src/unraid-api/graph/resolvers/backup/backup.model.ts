import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { type Layout } from '@jsonforms/core';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Matches,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import {
    PreprocessConfig,
    PreprocessConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/preprocessing/preprocessing.types.js';
import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';
import { RCloneJob } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';
import { DataSlice } from '@app/unraid-api/types/json-forms.js';

export enum BackupMode {
    RAW = 'RAW',
    PREPROCESSING = 'PREPROCESSING',
}

registerEnumType(BackupMode, {
    name: 'BackupMode',
    description: 'The mode of backup to perform (Raw file backup or Preprocessing-based).',
});

@ObjectType({
    implements: () => Node,
})
export class Backup extends Node {
    @Field(() => [RCloneJob])
    jobs!: RCloneJob[];

    @Field(() => [BackupJobConfig])
    configs!: BackupJobConfig[];
}

@InputType()
export class InitiateBackupInput {
    @Field(() => String, { description: 'The name of the remote configuration to use for the backup.' })
    @IsString()
    @IsNotEmpty()
    remoteName!: string;

    @Field(() => String, { description: 'Source path to backup.' })
    @IsString()
    @IsNotEmpty()
    sourcePath!: string;

    @Field(() => String, { description: 'Destination path on the remote.' })
    @IsString()
    @IsNotEmpty()
    destinationPath!: string;

    @Field(() => GraphQLJSON, {
        description: 'Additional options for the backup operation, such as --dry-run or --transfers.',
        nullable: true,
    })
    @IsOptional()
    @IsObject()
    options?: Record<string, unknown>;
}

@ObjectType()
export class BackupStatus {
    @Field(() => String, {
        description: 'Status message indicating the outcome of the backup initiation.',
    })
    status!: string;

    @Field(() => String, {
        description: 'Job ID if available, can be used to check job status.',
        nullable: true,
    })
    jobId?: string;
}

@ObjectType()
export class RCloneWebGuiInfo {
    @Field()
    url!: string;
}

@ObjectType({
    implements: () => Node,
})
export class BackupJobConfig extends Node {
    @Field(() => String, { description: 'Human-readable name for this backup job' })
    name!: string;

    @Field(() => BackupMode)
    backupMode!: BackupMode;

    @Field(() => String, { description: 'Source path to backup' })
    sourcePath!: string;

    @Field(() => String, { description: 'Remote name from rclone config' })
    remoteName!: string;

    @Field(() => String, { description: 'Destination path on the remote' })
    destinationPath!: string;

    @Field(() => String, {
        description: 'Cron schedule expression (e.g., "0 2 * * *" for daily at 2AM)',
    })
    schedule!: string;

    @Field(() => Boolean, { description: 'Whether this backup job is enabled' })
    enabled!: boolean;

    @Field(() => GraphQLJSON, {
        description: 'RClone options (e.g., --transfers, --checkers)',
        nullable: true,
    })
    rcloneOptions?: Record<string, unknown>;

    @Field(() => PreprocessConfig, {
        description: 'Preprocessing configuration for this backup job',
        nullable: true,
    })
    preprocessConfig?: PreprocessConfig;

    @Field(() => Date, { description: 'When this config was created' })
    createdAt!: Date;

    @Field(() => Date, { description: 'When this config was last updated' })
    updatedAt!: Date;

    @Field(() => Date, { description: 'Last time this job ran', nullable: true })
    lastRunAt?: Date;

    @Field(() => String, { description: 'Status of last run', nullable: true })
    lastRunStatus?: string;

    @Field(() => String, { description: 'Current running job ID', nullable: true })
    currentJobId?: string;

    @Field(() => RCloneJob, { description: 'Current running job for this config', nullable: true })
    currentJob?: RCloneJob;
}

@InputType()
export class CreateBackupJobConfigInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    name!: string;

    @Field(() => BackupMode, { defaultValue: BackupMode.PREPROCESSING })
    @IsEnum(BackupMode)
    @IsNotEmpty()
    backupMode?: BackupMode;

    @Field(() => String)
    @IsString()
    @ValidateIf((o) => o.backupMode === BackupMode.RAW)
    @IsNotEmpty({ message: 'sourcePath should not be empty when backupMode is RAW' })
    sourcePath!: string;

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    remoteName!: string;

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    destinationPath!: string;

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(\*|[0-5]?\d)(\s+(\*|[0-1]?\d|2[0-3]))(\s+(\*|[1-2]?\d|3[0-1]))(\s+(\*|[1-9]|1[0-2]))(\s+(\*|[0-6]))$/,
        {
            message: 'schedule must be a valid cron expression',
        }
    )
    schedule!: string;

    @Field(() => Boolean, { defaultValue: true })
    @IsBoolean()
    enabled!: boolean;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    rcloneOptions?: Record<string, unknown>;

    @Field(() => PreprocessConfigInput, {
        description: 'Preprocessing configuration for this backup job',
        nullable: true,
    })
    @IsOptional()
    @ValidateIf((o) => o.backupMode === BackupMode.PREPROCESSING)
    @ValidateNested()
    @Type(() => PreprocessConfigInput)
    preprocessConfig?: PreprocessConfigInput;
}

@InputType()
export class UpdateBackupJobConfigInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    sourcePath?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    remoteName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    destinationPath?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(\*|[0-5]?\d)(\s+(\*|[0-1]?\d|2[0-3]))(\s+(\*|[1-2]?\d|3[0-1]))(\s+(\*|[1-9]|1[0-2]))(\s+(\*|[0-6]))$/,
        {
            message: 'schedule must be a valid cron expression',
        }
    )
    schedule?: string;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    rcloneOptions?: Record<string, unknown>;

    @Field(() => PreprocessConfigInput, {
        description: 'Preprocessing configuration for this backup job',
        nullable: true,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => PreprocessConfigInput)
    preprocessConfig?: PreprocessConfigInput;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    lastRunStatus?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    currentJobId?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    lastRunAt?: string;
}

@ObjectType()
export class BackupJobConfigForm {
    @Field(() => PrefixedID)
    id!: string;

    @Field(() => GraphQLJSON)
    dataSchema!: { properties: DataSlice; type: 'object' };

    @Field(() => GraphQLJSON)
    uiSchema!: Layout;
}

@InputType()
export class BackupJobConfigFormInput {
    @Field(() => Boolean, { defaultValue: false })
    @IsOptional()
    @IsBoolean()
    showAdvanced?: boolean;
}
