import { gql } from '@apollo/client';

export const REMOVE_DOCKER_CONTAINER = gql`
  mutation RemoveDockerContainer($id: PrefixedID!, $withImage: Boolean) {
    docker {
      removeContainer(id: $id, withImage: $withImage)
    }
  }
`;
