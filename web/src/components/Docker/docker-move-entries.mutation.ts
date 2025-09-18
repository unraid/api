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
