import { Field, ObjectType } from '@nestjs/graphql';

import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class DockerConfig {
    @Field(() => String)
    @IsString()
    updateCheckCronSchedule!: string;

    @Field(() => GraphQLJSON, { nullable: true })
    @IsOptional()
    @IsObject()
    templateMappings?: Record<string, string | null>;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skipTemplatePaths?: string[];
}
