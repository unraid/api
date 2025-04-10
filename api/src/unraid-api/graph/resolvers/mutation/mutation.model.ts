import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType('ArrayMutations')
export class ArrayMutations {
    @Field()
    __typename: string = 'ArrayMutations';
}

@ObjectType('DockerMutations')
export class DockerMutations {
    @Field()
    __typename: string = 'DockerMutations';
}

@ObjectType()
export class Mutation {
    @Field(() => ArrayMutations)
    array: ArrayMutations = new ArrayMutations();

    @Field(() => DockerMutations)
    docker: DockerMutations = new DockerMutations();
}
