import { gql } from '@apollo/client';

export const GET_DOCKER_CONTAINER_SIZES = gql`
  query GetDockerContainerSizes {
    docker {
      id
      containers(skipCache: true) {
        id
        names
        sizeRootFs
        sizeRw
        sizeLog
      }
    }
  }
`;
