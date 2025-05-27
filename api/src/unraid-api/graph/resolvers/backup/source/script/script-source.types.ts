import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

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
