import { gql } from '@apollo/client';

export const SET_DOCKER_FOLDER_CHILDREN = gql`
  mutation SetDockerFolderChildren($folderId: String, $childrenIds: [String!]!) {
    setDockerFolderChildren(folderId: $folderId, childrenIds: $childrenIds) {
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
