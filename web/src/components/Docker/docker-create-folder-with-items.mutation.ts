import { gql } from '@apollo/client';

export const CREATE_DOCKER_FOLDER_WITH_ITEMS = gql`
  mutation CreateDockerFolderWithItems(
    $name: String!
    $parentId: String
    $sourceEntryIds: [String!]
    $position: Float
  ) {
    createDockerFolderWithItems(
      name: $name
      parentId: $parentId
      sourceEntryIds: $sourceEntryIds
      position: $position
    ) {
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
