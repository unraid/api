import { gql } from '@apollo/client';

export const UNPAUSE_DOCKER_CONTAINER = gql`
  mutation UnpauseDockerContainer($id: PrefixedID!) {
    docker {
      unpause(id: $id) {
        id
        names
        state
      }
    }
  }
`;
