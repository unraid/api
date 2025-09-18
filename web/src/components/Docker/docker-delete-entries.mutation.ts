import { gql } from '@apollo/client';

export const DELETE_DOCKER_ENTRIES = gql`
  mutation DeleteDockerEntries($entryIds: [String!]!) {
    deleteDockerEntries(entryIds: $entryIds) {
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
