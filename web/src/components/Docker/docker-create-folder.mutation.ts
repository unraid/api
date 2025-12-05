import { gql } from '@apollo/client';

export const CREATE_DOCKER_FOLDER = gql`
  mutation CreateDockerFolder($name: String!, $parentId: String, $childrenIds: [String!]) {
    createDockerFolder(name: $name, parentId: $parentId, childrenIds: $childrenIds) {
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
