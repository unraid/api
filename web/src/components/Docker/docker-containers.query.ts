import { gql } from '@apollo/client';

export const GET_DOCKER_CONTAINERS = gql`
  query GetDockerContainers($skipCache: Boolean = false) {
    docker {
      id
      containers(skipCache: $skipCache) {
        id
        names
        state
        status
        image
        created
        autoStart
        autoStartOrder
        autoStartWait
        ports {
          privatePort
          publicPort
          type
        }
        hostConfig {
          networkMode
        }
        networkSettings
        mounts
      }
      organizer(skipCache: $skipCache) {
        version
        views {
          id
          name
          rootId
          prefs
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
              networkSettings
              mounts
              created
              isUpdateAvailable
              isRebuildReady
              templatePath
            }
          }
        }
      }
    }
  }
`;
