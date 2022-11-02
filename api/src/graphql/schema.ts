import { makeExecutableSchema } from '@graphql-tools/schema';
import { types as typeDefs } from '@app/graphql/types';
import * as resolvers from '@app/graphql/resolvers';

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers,
});
