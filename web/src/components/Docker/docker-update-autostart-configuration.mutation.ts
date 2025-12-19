import { gql } from '@apollo/client';

export const UPDATE_DOCKER_AUTOSTART_CONFIGURATION = gql`
  mutation UpdateDockerAutostartConfiguration(
    $entries: [DockerAutostartEntryInput!]!
    $persistUserPreferences: Boolean
  ) {
    docker {
      updateAutostartConfiguration(entries: $entries, persistUserPreferences: $persistUserPreferences)
    }
  }
`;
