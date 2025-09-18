import { gql } from '@apollo/client';

export const STOP_DOCKER_CONTAINER = gql`
  mutation StopDockerContainer($id: PrefixedID!) {
    docker {
      stop(id: $id) {
        id
        names
        state
      }
    }
  }
`;
