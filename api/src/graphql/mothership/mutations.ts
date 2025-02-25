import { graphql } from '@app/graphql/generated/client/gql.js';

export const SEND_REMOTE_QUERY_RESPONSE = graphql(/* GraphQL */ `
    mutation sendRemoteGraphQLResponse($input: RemoteGraphQLServerInput!) {
        remoteGraphQLResponse(input: $input)
    }
`);
