import gql from 'graphql-tag';

export const UPDATE_SERVER_IDENTITY_MUTATION = gql`
  mutation UpdateServerIdentity($name: String!, $comment: String, $sysModel: String) {
    updateServerIdentity(name: $name, comment: $comment, sysModel: $sysModel) {
      id
      name
      comment
    }
  }
`;

export const SET_THEME_MUTATION = gql`
  mutation SetLegacyTheme($theme: String!) {
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

export const UPDATE_SSH_SETTINGS_MUTATION = gql`
  mutation UpdateSshSettings($enabled: Boolean!, $port: Int = 22) {
    updateSshSettings(input: { enabled: $enabled, port: $port }) {
      id
      useSsh
      portssh
    }
  }
`;
