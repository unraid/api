import { makeExecutableSchema } from '@graphql-tools/schema';

import { resolvers } from '@app/graphql/resolvers/resolvers';
import { typeDefs } from '@app/graphql/schema/index';

const baseSchema = makeExecutableSchema({
    typeDefs: typeDefs,
    resolvers,
});

export const schema = baseSchema;
