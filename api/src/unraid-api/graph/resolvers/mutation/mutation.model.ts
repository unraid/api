import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArrayMutations {
    @Field(() => Boolean, { description: 'Placeholder field to ensure the type is not empty' })
    _: boolean = false;
}

@ObjectType()
export class DockerMutations {
    @Field(() => Boolean, { description: 'Placeholder field to ensure the type is not empty' })
    _: boolean = false;
}

@ObjectType()
export class RootMutations {
    @Field(() => ArrayMutations, { description: 'Array related mutations' })
    array: ArrayMutations = new ArrayMutations();

    @Field(() => DockerMutations, { description: 'Docker related mutations' })
    docker: DockerMutations = new DockerMutations();
}
