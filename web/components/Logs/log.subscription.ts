import { graphql } from '~/composables/gql/gql';

export const LOG_FILE_SUBSCRIPTION = graphql(/* GraphQL */ `
  subscription LogFileSubscription($path: String!, $filter: String) {
    logFile(path: $path, filter: $filter) {
      path
      content
      totalLines
    }
  }
`); 
