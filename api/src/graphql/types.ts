import { mergeTypeDefs } from '@graphql-tools/merge';
import { gql } from 'graphql-tag';
import { typeDefs } from '@app/graphql/schema/index';

export const baseTypes = [gql`
	scalar JSON
	scalar Long
	scalar UUID
	scalar DateTime

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
	typeDefs,
]);
