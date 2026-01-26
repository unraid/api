import gql from 'graphql-tag';

export const UPDATE_SERVER_IDENTITY_MUTATION = gql`
  mutation UpdateServerIdentity($name: String!, $comment: String) {
    updateServerIdentity(name: $name, comment: $comment) {
      id
      name
      comment
    }
  }
`;

export const SET_THEME_MUTATION = gql`
  mutation SetTheme($theme: String!) {
    setTheme(theme: $theme) {
      id
      theme
    }
  }
`;

export const SET_LOCALE_MUTATION = gql`
  mutation SetLocale($locale: String!) {
    setLocale(locale: $locale) {
      id
      locale
    }
  }
`;

export const INSTALL_PLUGIN_MUTATION = gql`
  mutation InstallPlugin($input: InstallPluginInput!) {
    unraidPlugins {
      installPlugin(input: $input) {
        id
        status
      }
    }
  }
`;

export const INSTALL_LANGUAGE_MUTATION = gql`
  mutation InstallLanguage($input: InstallPluginInput!) {
    unraidPlugins {
      installLanguage(input: $input) {
        id
        status
      }
    }
  }
`;
