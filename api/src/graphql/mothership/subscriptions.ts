import { graphql } from '@app/graphql/generated/client/gql';

export const RemoteGraphQL_Fragment = graphql(/* GraphQL */ `
    fragment RemoteGraphQLEventFragment on RemoteGraphQLEvent {
        remoteGraphQLEventData: data {
                type
                body
                sha256
        }
    }
`);


export const RemoteAccess_Fragment = graphql(/* GraphQL */ `
    fragment RemoteAccessEventFragment on RemoteAccessEvent {
        type
        data {
            type
            url {
                type
                name
                ipv4
                ipv6
            }
            apiKey
        }
    }
`);

export const PingEvent_Fragment = graphql(/* GraphQL */`
    fragment PingEventFragment on ClientPingEvent {
        type
    }
`)

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
            ...RemoteAccessEventFragment
            ...RemoteGraphQLEventFragment
            ...PingEventFragment
        }
    }
`);
