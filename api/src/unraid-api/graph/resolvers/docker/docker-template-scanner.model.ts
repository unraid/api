import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DockerTemplateSyncResult {
    @Field(() => Int)
    scanned!: number;

    @Field(() => Int)
    matched!: number;

    @Field(() => Int)
    skipped!: number;

    @Field(() => [String])
    errors!: string[];
}

