import { mergeTypeDefs } from '@graphql-tools/merge';
import { gql } from 'graphql-tag';
import { typeDefs } from '@app/graphql/schema/index';

export const baseTypes = [
    gql`
        scalar JSON
        scalar Long
        scalar UUID
        scalar DateTime
        scalar Port

        directive @subscription(channel: String!) on FIELD_DEFINITION

        type Welcome {
            message: String!
        }

        type Query {
            # This should always be available even for guest users
            welcome: Welcome @func(module: "getWelcome")
            online: Boolean
            info: Info
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
    `,
];

export const types = mergeTypeDefs([
	...baseTypes,
	typeDefs,
]);

export default types;
