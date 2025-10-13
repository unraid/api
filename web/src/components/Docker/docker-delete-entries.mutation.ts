import { gql } from '@apollo/client';

export const DELETE_DOCKER_ENTRIES = gql`
  mutation DeleteDockerEntries($entryIds: [String!]!) {
    deleteDockerEntries(entryIds: $entryIds) {
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
