import { gql } from '@apollo/client';

export const CREATE_DOCKER_FOLDER = gql`
  mutation CreateDockerFolder($name: String!, $parentId: String, $childrenIds: [String!]) {
    createDockerFolder(name: $name, parentId: $parentId, childrenIds: $childrenIds) {
      version
      views {
        id
        name
        root {
          __typename
          ... on ResolvedOrganizerFolder {
            id
            name
            type
            children {
              __typename
              ... on ResolvedOrganizerFolder {
                id
                name
                type
              }
              ... on OrganizerContainerResource {
                id
                name
                type
              }
            }
          }
        }
      }
    }
  }
`;
