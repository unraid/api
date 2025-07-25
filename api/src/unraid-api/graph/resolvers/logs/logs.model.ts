import { Field, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';

import { IsInt, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class LogFile {
    @Field(() => String, { description: 'Name of the log file' })
    name!: string;

    @Field(() => String, { description: 'Full path to the log file' })
    path!: string;

    @Field(() => Int, { description: 'Size of the log file in bytes' })
    size!: number;

    @Field(() => GraphQLISODateTime, { description: 'Last modified timestamp' })
    modifiedAt!: Date;
}

@ObjectType()
export class LogFileContent {
    @Field(() => String, { description: 'Path to the log file' })
    path!: string;

    @Field(() => String, { description: 'Content of the log file' })
    content!: string;

    @Field(() => Int, { description: 'Total number of lines in the file' })
    totalLines!: number;

    @Field(() => Int, { nullable: true, description: 'Starting line number of the content (1-indexed)' })
    startLine?: number;
}

@InputType()
export class LogFileInput {
    @Field(() => String, { description: 'Path to the log file' })
    @IsString()
    path!: string;

    @Field(() => Int, {
        nullable: true,
        description: 'Number of lines to read from the end of the file (default: 100)',
    })
    @IsOptional()
    @IsInt()
    lines?: number;

    @Field(() => Int, { nullable: true, description: 'Optional starting line number (1-indexed)' })
    @IsOptional()
    @IsInt()
    startLine?: number;
}
