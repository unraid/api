import { gql } from '@apollo/client';

export const UPDATE_DOCKER_CONTAINER = gql`
  mutation UpdateDockerContainer($id: PrefixedID!) {
    docker {
      updateContainer(id: $id) {
        id
        names
        state
        isUpdateAvailable
        isRebuildReady
      }
    }
  }
`;
