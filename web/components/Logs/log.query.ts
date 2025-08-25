import { graphql } from '~/composables/gql/gql';

export const GET_LOG_FILES = graphql(/* GraphQL */ `
  query LogFiles {
    logFiles {
      name
      path
      size
      modifiedAt
    }
  }
`);

export const GET_LOG_FILE_CONTENT = graphql(/* GraphQL */ `
  query LogFileContent($path: String!, $lines: Int, $startLine: Int) {
    logFile(path: $path, lines: $lines, startLine: $startLine) {
      path
      content
      totalLines
      startLine
    }
  }
`);
