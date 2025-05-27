import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
