import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
    BaseSourceConfig,
    BaseSourceConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/base-source.types.js';

@InputType()
export class FlashPreprocessConfigInput extends BaseSourceConfigInput {
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
export class FlashPreprocessConfig implements BaseSourceConfig {
    @Field(() => String, { nullable: false })
    label: string = 'Flash drive backup';

    @Field(() => String)
    flashPath!: string;

    @Field(() => Boolean)
    includeGitHistory!: boolean;

    @Field(() => [String], { nullable: true })
    additionalPaths?: string[];

    static isTypeOf(obj: any): obj is FlashPreprocessConfig {
        return obj && typeof obj.flashPath === 'string' && typeof obj.includeGitHistory === 'boolean';
    }
}
