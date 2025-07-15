import { createUnionType, Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';

import {
    FlashPreprocessConfig,
    FlashPreprocessConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/flash/flash-source.types.js';
import {
    RawBackupConfig,
    RawBackupConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/raw/raw-source.types.js';
import {
    ScriptPreprocessConfig,
    ScriptPreprocessConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/script/script-source.types.js';
import {
    ZfsPreprocessConfig,
    ZfsPreprocessConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/zfs/zfs-source.types.js';

export enum SourceType {
    ZFS = 'ZFS',
    FLASH = 'FLASH',
    SCRIPT = 'SCRIPT',
    RAW = 'RAW',
}

registerEnumType(SourceType, {
    name: 'SourceType',
    description:
        'Type of backup to perform (ZFS snapshot, Flash backup, Custom script, or Raw file backup)',
});

export { ZfsPreprocessConfigInput, ZfsPreprocessConfig };
export { FlashPreprocessConfigInput, FlashPreprocessConfig };
export { ScriptPreprocessConfigInput, ScriptPreprocessConfig };
export { RawBackupConfigInput, RawBackupConfig };

@InputType()
export class SourceConfigInput {
    @Field(() => SourceType, { nullable: false })
    @IsEnum(SourceType, { message: 'Invalid source type' })
    type!: SourceType;

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
export class SourceConfig {
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

export const SourceConfigUnion = createUnionType({
    name: 'SourceConfigUnion',
    types: () =>
        [ZfsPreprocessConfig, FlashPreprocessConfig, ScriptPreprocessConfig, RawBackupConfig] as const,
    resolveType(obj: any, context, info) {
        if (ZfsPreprocessConfig.isTypeOf && ZfsPreprocessConfig.isTypeOf(obj)) {
            return ZfsPreprocessConfig;
        }
        if (FlashPreprocessConfig.isTypeOf && FlashPreprocessConfig.isTypeOf(obj)) {
            return FlashPreprocessConfig;
        }
        if (ScriptPreprocessConfig.isTypeOf && ScriptPreprocessConfig.isTypeOf(obj)) {
            return ScriptPreprocessConfig;
        }
        if (RawBackupConfig.isTypeOf && RawBackupConfig.isTypeOf(obj)) {
            return RawBackupConfig;
        }
        console.error(`[SourceConfigUnion] Could not resolve type for object: ${JSON.stringify(obj)}`);
        return null;
    },
});

export const SourceConfigInputUnion = SourceConfigInput;

export interface PreprocessResult {
    success: boolean;
    streamPath?: string;
    outputPath?: string;
    snapshotName?: string;
    error?: string;
    cleanupRequired?: boolean;
    metadata?: Record<string, unknown>;
}
