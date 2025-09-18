import { gql } from '@apollo/client';

export const START_DOCKER_CONTAINER = gql`
  mutation StartDockerContainer($id: PrefixedID!) {
    docker {
      start(id: $id) {
        id
        names
        state
      }
    }
  }
`;
