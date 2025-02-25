import { graphql } from '@app/graphql/generated/client/gql.js';

export const RemoteGraphQL_Fragment = graphql(/* GraphQL */ `
    fragment RemoteGraphQLEventFragment on RemoteGraphQLEvent {
        remoteGraphQLEventData: data {
            type
            body
            sha256
        }
    }
`);

export const EVENTS_SUBSCRIPTION = graphql(/* GraphQL */ `
    subscription events {
        events {
            __typename
            ... on ClientConnectedEvent {
                connectedData: data {
                    type
                    version
                    apiKey
                }
                connectedEvent: type
            }
            ... on ClientDisconnectedEvent {
                disconnectedData: data {
                    type
                    version
                    apiKey
                }
                disconnectedEvent: type
            }
            ...RemoteGraphQLEventFragment
        }
    }
`);
