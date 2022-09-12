import { makeExecutableSchema } from '@graphql-tools/schema';
import { FuncDirective } from '@app/graphql/func-directive';
import { types as typeDefs } from '@app/graphql/types';
import * as resolvers from '@app/graphql/resolvers';

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers,
	schemaDirectives: {
		func: FuncDirective,
	},
});
