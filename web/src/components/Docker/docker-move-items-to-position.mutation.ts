import { gql } from '@apollo/client';

export const MOVE_DOCKER_ITEMS_TO_POSITION = gql`
  mutation MoveDockerItemsToPosition(
    $sourceEntryIds: [String!]!
    $destinationFolderId: String!
    $position: Float!
  ) {
    moveDockerItemsToPosition(
      sourceEntryIds: $sourceEntryIds
      destinationFolderId: $destinationFolderId
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

