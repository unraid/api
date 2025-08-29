import { graphql } from '~/composables/gql';

export const allConfigFilesQuery = graphql(`
  query AllConfigFiles {
    allConfigFiles {
      files {
        name
        content
        path
        sizeReadable
      }
    }
  }
`);

export const configFileQuery = graphql(`
  query ConfigFile($name: String!) {
    configFile(name: $name) {
      name
      content
      path
      sizeReadable
    }
  }
`);
