import { gql } from '@apollo/client';

export const GET_DOCKER_CONTAINER_LOGS = gql`
  query GetDockerContainerLogs($id: PrefixedID!, $since: DateTime, $tail: Int) {
    docker {
      logs(id: $id, since: $since, tail: $tail) {
        containerId
        cursor
        lines {
          timestamp
          message
        }
      }
    }
  }
`;
