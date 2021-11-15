import { mergeTypeDefs } from '@graphql-tools/merge';
import { gql } from 'graphql-tag';
import { typeDefs } from './schema';

export const baseTypes = [gql`
	scalar JSON
	scalar Long
	scalar UUID
	scalar DateTime

	directive @func(
		module: String
		data: JSON
		query: JSON
		result: String
		extractFromResponse: String
	) on FIELD_DEFINITION

	directive @subscription(
		channel: String!
	) on FIELD_DEFINITION

	type Welcome {
		message: String!
	}

	type Query {
		# This should always be available even for guest users
		welcome: Welcome! @func(module: "getWelcome")
		online: Boolean!
		info: Info!
		pluginModule(plugin: String!, module: String!, params: JSON, result: String): JSON @func(result: "json")
	}

	type Mutation {
		login(username: String!, password: String!): String
		sendNotification(notification: NotificationInput!): Notification
		shutdown: String
		reboot: String
	}

	type Subscription {
		ping: String!
		info: Info!
		pluginModule(plugin: String!, module: String!, params: JSON, result: String): JSON!
		online: Boolean!
	}
`];

// Add test defs in dev mode
if (process.env.NODE_ENV === 'development') {
	const testDefs = gql`
		# Test query
		input testQueryInput {
			state: String!
			optional: Boolean
		}
		type Query {
			testQuery(id: String!, input: testQueryInput): JSON @func(module: "getContext")
		}

		# Test mutation
		input testMutationInput {
			state: String!
		}
		type Mutation {
			testMutation(id: String!, input: testMutationInput): JSON @func(module: "getContext")
		}

		# Test subscription
		type Subscription {
			testSubscription: String!
		}
	`;
	baseTypes.push(testDefs);
}

export const types = mergeTypeDefs([
	...baseTypes,
	typeDefs
]);
