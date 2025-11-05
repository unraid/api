import { gql } from '@apollo/client';

export const UPDATE_DOCKER_AUTOSTART_CONFIGURATION = gql`
  mutation UpdateDockerAutostartConfiguration($entries: [DockerAutostartEntryInput!]!) {
    docker {
      updateAutostartConfiguration(entries: $entries)
    }
  }
`;
