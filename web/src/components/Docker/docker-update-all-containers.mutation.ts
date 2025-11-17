import { gql } from '@apollo/client';

export const UPDATE_ALL_DOCKER_CONTAINERS = gql`
  mutation UpdateAllDockerContainers {
    docker {
      updateAllContainers {
        id
        names
        state
        isUpdateAvailable
        isRebuildReady
      }
    }
  }
`;
