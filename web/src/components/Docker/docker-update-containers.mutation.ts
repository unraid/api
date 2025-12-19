import { gql } from '@apollo/client';

export const UPDATE_DOCKER_CONTAINERS = gql`
  mutation UpdateDockerContainers($ids: [PrefixedID!]!) {
    docker {
      updateContainers(ids: $ids) {
        id
        names
        state
        isUpdateAvailable
        isRebuildReady
      }
    }
  }
`;
