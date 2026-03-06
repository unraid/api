import gql from 'graphql-tag';

export { SET_THEME_MUTATION } from '~/components/DevThemeSwitcher.mutation';

export const UPDATE_SERVER_IDENTITY_MUTATION = gql`
  mutation UpdateServerIdentity($name: String!, $comment: String, $sysModel: String) {
    updateServerIdentity(name: $name, comment: $comment, sysModel: $sysModel) {
      id
      name
      comment
    }
  }
`;

export const SET_LOCALE_MUTATION = gql`
  mutation SetLocale($locale: String!) {
    customization {
      setLocale(locale: $locale)
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
