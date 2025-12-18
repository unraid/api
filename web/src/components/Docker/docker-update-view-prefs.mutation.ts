import { gql } from '@apollo/client';

export const UPDATE_DOCKER_VIEW_PREFERENCES = gql`
  mutation UpdateDockerViewPreferences($viewId: String, $prefs: JSON!) {
    updateDockerViewPreferences(viewId: $viewId, prefs: $prefs) {
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
`;
