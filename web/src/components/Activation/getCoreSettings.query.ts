import gql from 'graphql-tag';

export const GET_CORE_SETTINGS_QUERY = gql`
  query GetCoreSettings {
    vars {
      name
      useSsh
    }
    server {
      name
      comment
    }
    display {
      theme
      locale
    }
    systemTime {
      timeZone
    }
  }
`;
