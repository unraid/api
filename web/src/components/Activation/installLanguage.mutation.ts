import gql from 'graphql-tag';

export const INSTALL_LANGUAGE_MUTATION = gql`
  mutation InstallLanguage($input: InstallPluginInput!) {
    unraidPlugins {
      installLanguage(input: $input) {
        id
        url
        name
        status
        createdAt
        updatedAt
        finishedAt
        output
      }
    }
  }
`;
