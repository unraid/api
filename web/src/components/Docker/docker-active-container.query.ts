import { gql } from '@apollo/client';

export const GET_DOCKER_ACTIVE_CONTAINER = gql`
  query GetDockerActiveContainer($id: PrefixedID!) {
    docker {
      id
      containers {
        id
        names
        image
        created
        state
        status
        autoStart
        ports {
          privatePort
          publicPort
          type
        }
        hostConfig {
          networkMode
        }
        networkSettings
        labels
      }
    }
  }
`;
