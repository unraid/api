import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsOptional, IsString } from 'class-validator';

@InputType()
export abstract class BaseSourceConfigInput {
    @Field(() => String, {
        description: 'Human-readable label for this source configuration',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    label?: string;
}

export interface BaseSourceConfig {
    label: string;
}
