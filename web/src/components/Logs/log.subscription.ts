import { graphql } from '~/composables/gql/gql';

export const LOG_FILE_SUBSCRIPTION = graphql(/* GraphQL */ `
  subscription LogFileSubscription($path: String!) {
    logFile(path: $path) {
      path
      content
      totalLines
    }
  }
`);
