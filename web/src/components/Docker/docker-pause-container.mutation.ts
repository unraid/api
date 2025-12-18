import { gql } from '@apollo/client';

export const PAUSE_DOCKER_CONTAINER = gql`
  mutation PauseDockerContainer($id: PrefixedID!) {
    docker {
      pause(id: $id) {
        id
        names
        state
      }
    }
  }
`;
