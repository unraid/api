import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArrayMutations {}

@ObjectType()
export class DockerMutations {}

@ObjectType()
export class VmMutations {}

@ObjectType()
export class RootMutations {
    @Field(() => ArrayMutations, { description: 'Array related mutations' })
    array: ArrayMutations = new ArrayMutations();

    @Field(() => DockerMutations, { description: 'Docker related mutations' })
    docker: DockerMutations = new DockerMutations();
}
