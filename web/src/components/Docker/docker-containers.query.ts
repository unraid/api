import { gql } from '@apollo/client';

export const GET_DOCKER_CONTAINERS = gql`
  query GetDockerContainers($skipCache: Boolean = false) {
    docker {
      id
      portConflicts(skipCache: $skipCache) {
        containerPorts {
          privatePort
          type
          containers {
            id
            name
          }
        }
        lanPorts {
          lanIpPort
          publicPort
          type
          containers {
            id
            name
          }
        }
      }
      containers(skipCache: $skipCache) {
        id
        names
        state
        status
        image
        created
        lanIpPorts
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
        isOrphaned
        projectUrl
        registryUrl
        supportUrl
        iconUrl
        webUiUrl
        shell
        templatePorts {
          privatePort
          publicPort
          type
        }
        tailscaleEnabled
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
            meta {
              id
              names
              state
              status
              image
              lanIpPorts
              ports {
                privatePort
                publicPort
                type
              }
              autoStart
              autoStartWait
              hostConfig {
                networkMode
              }
              networkSettings
              mounts
              created
              isUpdateAvailable
              isRebuildReady
              templatePath
              isOrphaned
              projectUrl
              registryUrl
              supportUrl
              iconUrl
              webUiUrl
              shell
              templatePorts {
                privatePort
                publicPort
                type
              }
              tailscaleEnabled
            }
          }
        }
      }
    }
  }
`;
