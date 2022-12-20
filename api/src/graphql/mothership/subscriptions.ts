import { graphql } from '@app/graphql/generated/client/gql';

export const EVENTS_SUBSCRIPTION = graphql(/* GraphQL */ `
subscription events($apiKey: String!) {
  events @auth(apiKey: $apiKey) {
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
  }
}
`);
