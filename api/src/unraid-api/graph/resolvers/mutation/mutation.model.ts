import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ArrayMutations {}

@ObjectType()
export class DockerMutations {}

@ObjectType()
export class VmMutations {}

@ObjectType({
    description: 'Parity check related mutations, WIP, response types and functionaliy will change',
})
export class ParityCheckMutations {}

@ObjectType()
export class RootMutations {
    @Field(() => ArrayMutations, { description: 'Array related mutations' })
    array: ArrayMutations = new ArrayMutations();

    @Field(() => DockerMutations, { description: 'Docker related mutations' })
    docker: DockerMutations = new DockerMutations();

    @Field(() => VmMutations, { description: 'VM related mutations' })
    vm: VmMutations = new VmMutations();

    @Field(() => ParityCheckMutations, { description: 'Parity check related mutations' })
    parityCheck: ParityCheckMutations = new ParityCheckMutations();
}
