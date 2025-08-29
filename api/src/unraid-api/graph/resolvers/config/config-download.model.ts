import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ConfigFile {
    @Field()
    name: string;

    @Field()
    content: string;

    @Field()
    path: string;
}

@ObjectType()
export class ConfigFilesResponse {
    @Field(() => [ConfigFile])
    files: ConfigFile[];
}
