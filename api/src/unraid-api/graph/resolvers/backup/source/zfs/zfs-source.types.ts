import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import {
    BaseSourceConfig,
    BaseSourceConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/base-source.types.js';

@InputType()
export class ZfsPreprocessConfigInput extends BaseSourceConfigInput {
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
export class ZfsPreprocessConfig implements BaseSourceConfig {
    @Field(() => String, { nullable: false })
    label: string = 'ZFS backup';

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
