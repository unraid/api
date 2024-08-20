import { graphql } from '@app/graphql/generated/client/gql';

// This doesn't need auth directive, new mothership can handle clients with no auth directives
export const SEND_DYNAMIC_REMOTE_ACCESS_MUTATION = graphql(/* GraphQL */ `
mutation sendRemoteAccessMutation($remoteAccess: RemoteAccessInput!) {
	remoteSession(remoteAccess: $remoteAccess)
}
`);

export const SEND_REMOTE_QUERY_RESPONSE = graphql(/* GraphQL */ `
    mutation sendRemoteGraphQLResponse($input: RemoteGraphQLServerInput!) {
        remoteGraphQLResponse(input: $input)
    }
`);
