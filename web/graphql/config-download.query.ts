import { graphql } from '~/composables/gql';

export const allConfigFilesQuery = graphql(`
  query AllConfigFiles {
    allConfigFiles {
      files {
        name
        content
        path
      }
    }
  }
`);
