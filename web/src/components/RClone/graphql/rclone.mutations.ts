import { graphql } from '~/composables/gql/gql';

// Create a new remote
export const CREATE_REMOTE = graphql(/* GraphQL */ `
  mutation CreateRCloneRemote($input: CreateRCloneRemoteInput!) {
    rclone {
      createRCloneRemote(input: $input) {
        name
        type
        parameters
      }
    }
  }
`);

// Delete a remote
export const DELETE_REMOTE = graphql(/* GraphQL */ `
  mutation DeleteRCloneRemote($input: DeleteRCloneRemoteInput!) {
    rclone {
      deleteRCloneRemote(input: $input)
    }
  }
`);
