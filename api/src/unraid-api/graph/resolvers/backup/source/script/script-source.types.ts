import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

import {
    BaseSourceConfig,
    BaseSourceConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/source/base-source.types.js';

@InputType()
export class ScriptPreprocessConfigInput extends BaseSourceConfigInput {
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
export class ScriptPreprocessConfig implements BaseSourceConfig {
    @Field(() => String, { nullable: false })
    label: string = 'Script backup';

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
