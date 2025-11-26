import { gql } from '@apollo/client';

export const MOVE_DOCKER_ENTRIES_TO_FOLDER = gql`
  mutation MoveDockerEntriesToFolder($destinationFolderId: String!, $sourceEntryIds: [String!]!) {
    moveDockerEntriesToFolder(
      destinationFolderId: $destinationFolderId
      sourceEntryIds: $sourceEntryIds
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
        }
      }
    }
  }
`;
