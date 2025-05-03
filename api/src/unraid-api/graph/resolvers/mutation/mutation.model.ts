import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Important:
 *
 * When adding a new mutation, you must also add it to the RootMutations resolver
 *
 * @file src/unraid-api/graph/resolvers/mutation/mutation.resolver.ts
 */

@ObjectType()
export class ArrayMutations {}

@ObjectType()
export class DockerMutations {}

@ObjectType()
export class VmMutations {}

@ObjectType({
    description: 'API Key related mutations',
})
export class ApiKeyMutations {}

@ObjectType({
    description: 'Parity check related mutations, WIP, response types and functionaliy will change',
})
export class ParityCheckMutations {}

@ObjectType({
    description: 'RClone related mutations',
})
export class RCloneMutations {}

@ObjectType()
export class RootMutations {
    @Field(() => ArrayMutations, { description: 'Array related mutations' })
    array: ArrayMutations = new ArrayMutations();

    @Field(() => DockerMutations, { description: 'Docker related mutations' })
    docker: DockerMutations = new DockerMutations();

    @Field(() => VmMutations, { description: 'VM related mutations' })
    vm: VmMutations = new VmMutations();

    @Field(() => ApiKeyMutations, { description: 'API Key related mutations' })
    apiKey: ApiKeyMutations = new ApiKeyMutations();

    @Field(() => ParityCheckMutations, { description: 'Parity check related mutations' })
    parityCheck: ParityCheckMutations = new ParityCheckMutations();

    @Field(() => RCloneMutations, { description: 'RClone related mutations' })
    rclone: RCloneMutations = new RCloneMutations();
}
