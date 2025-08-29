import { Field, ObjectType } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

@ObjectType()
export class ConfigFile {
    @Field()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    content!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    path!: string;

    @Field({ description: 'Human-readable file size (e.g., "1.5 KB", "2.3 MB")' })
    @IsString()
    @IsNotEmpty()
    sizeReadable!: string;
}

@ObjectType()
export class ConfigFilesResponse {
    @Field(() => [ConfigFile])
    files!: ConfigFile[];
}
