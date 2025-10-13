import { gql } from '@apollo/client';

export const SET_DOCKER_FOLDER_CHILDREN = gql`
  mutation SetDockerFolderChildren($folderId: String, $childrenIds: [String!]!) {
    setDockerFolderChildren(folderId: $folderId, childrenIds: $childrenIds) {
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
