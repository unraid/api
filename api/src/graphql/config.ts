import { config } from '@app/core/config';
import { schema } from '@app/graphql/schema';
import { types as typeDefs } from '@app/graphql/types';
import { type ApolloServerExpressConfig } from 'apollo-server-express';
import { apiKeyToUser } from '@app/graphql';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';

export const apolloConfig: ApolloServerExpressConfig = {
	debug: config.debug,
	introspection: Boolean(process.env.INTROSPECTION ?? config.debug),
	schema,
	typeDefs,

	cache: new InMemoryLRUCache(),
	async context({ req, connection }: { req: { headers: Record<string, string> }; connection: { context: Record<string, unknown> } }) {
		// Normal Websocket connection
		if (connection && Object.keys(connection.context).length >= 1) {
			// Check connection for metadata
			return {
				...connection.context,
			};
		}

		// Normal HTTP connection
		if (req) {
			const apiKey = req.headers['x-api-key'];
			const user = await apiKeyToUser(apiKey);

			return {
				user,
			};
		}

		throw new Error('Invalid API key');
	},
};
