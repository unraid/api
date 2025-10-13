import { gql } from '@apollo/client';

export const RENAME_DOCKER_FOLDER = gql`
  mutation RenameDockerFolder($folderId: String!, $newName: String!) {
    renameDockerFolder(folderId: $folderId, newName: $newName) {
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
          }
        }
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

