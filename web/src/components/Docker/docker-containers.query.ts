import { gql } from '@apollo/client';

export const GET_DOCKER_CONTAINERS = gql`
  query GetDockerContainers($skipCache: Boolean = false) {
    docker {
      id
      organizer(skipCache: $skipCache) {
        version
        views {
          id
          name
          rootId
          flatEntries {
            id
            type
            name
            parentId
            depth
            position
            path
            hasChildren
            childrenIds
            icon
            meta {
              id
              names
              state
              status
              image
              ports {
                privatePort
                publicPort
                type
              }
              autoStart
              hostConfig {
                networkMode
              }
              created
              isUpdateAvailable
              isRebuildReady
            }
          }
        }
      }
    }
  }
`;
