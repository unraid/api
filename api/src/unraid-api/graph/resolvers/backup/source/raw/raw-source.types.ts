import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
    BaseSourceConfig,
    BaseSourceConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/base-source.types.js';

@InputType()
export class RawBackupConfigInput extends BaseSourceConfigInput {
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
export class RawBackupConfig implements BaseSourceConfig {
    @Field(() => String, { nullable: false })
    label: string = 'Raw file backup';

    @Field(() => String)
    sourcePath!: string;

    @Field(() => [String], { nullable: true })
    excludePatterns?: string[];

    @Field(() => [String], { nullable: true })
    includePatterns?: string[];

    static isTypeOf(obj: any): obj is RawBackupConfig {
        return obj && typeof obj.sourcePath === 'string';
    }
}
