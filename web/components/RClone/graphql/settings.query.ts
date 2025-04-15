import { graphql } from "~/composables/gql/gql";


export const GET_RCLONE_CONFIG_FORM = graphql(/* GraphQL */ `
  query GetRCloneConfigForm($providerType: String, $parameters: JSON) {
    rcloneBackup {
      configForm(providerType: $providerType, parameters: $parameters) {    
        dataSchema
        uiSchema
      }
    }
  }
`);

export const LIST_REMOTES = graphql(/* GraphQL */ `
  query ListRCloneRemotes {
    rcloneBackup {
      remotes
    }
  }
`);

export const CREATE_REMOTE = graphql(/* GraphQL */ `
  mutation CreateRCloneRemote($input: CreateRCloneRemoteInput!) {
    createRCloneRemote(input: $input) {
      name
      type
      config
    }
  }
`);