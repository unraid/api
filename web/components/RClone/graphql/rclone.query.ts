import { graphql } from '~/composables/gql/gql';

// Get RClone configuration form
export const GET_RCLONE_CONFIG_FORM = graphql(/* GraphQL */ `
  query GetRCloneConfigForm($formOptions: RCloneConfigFormInput) {
    rclone {
      configForm(formOptions: $formOptions) {
        id
        dataSchema
        uiSchema
      }
    }
  }
`);

// Get all remotes
export const GET_RCLONE_REMOTES = graphql(/* GraphQL */ `
  query ListRCloneRemotes {
    rclone {
      remotes {
        name
        type
        parameters
        config
      }
    }
  }
`);

