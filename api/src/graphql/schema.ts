import { makeExecutableSchema } from '@graphql-tools/schema';
import { types as typeDefs } from '@app/graphql/types';
import * as resolvers from '@app/graphql/resolvers';
import { getFuncDirective } from '@app/graphql/func-directive';
import { mergeTypeDefs } from '@graphql-tools/merge';

const { funcDirectiveTypeDefs, funcDirectiveTransformer } = getFuncDirective();

const baseSchema = makeExecutableSchema({
	typeDefs: mergeTypeDefs([
		funcDirectiveTypeDefs,
		typeDefs,
	]),
	resolvers,
});

export const schema = funcDirectiveTransformer(baseSchema);
