import { makeExecutableSchema } from '@graphql-tools/schema';
import { FuncDirective } from './func-directive';
import { types as typeDefs } from './types';
import * as resolvers from './resolvers';

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers,
	schemaDirectives: {
		func: FuncDirective
	}
});
