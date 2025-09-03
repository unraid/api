import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DockerConfig {
    @Field(() => String)
    updateCheckCronSchedule!: string;
}
