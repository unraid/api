import gql from 'graphql-tag';

export const GET_CORE_SETTINGS_QUERY = gql`
  query GetCoreSettings {
    customization {
      activationCode {
        system {
          serverName
          comment
        }
      }
    }
    vars {
      name
      sysModel
      useSsh
      localTld
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
    info {
      primaryNetwork {
        ipAddress
      }
    }
  }
`;
