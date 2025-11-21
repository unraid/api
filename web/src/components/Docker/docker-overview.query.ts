import { gql } from '@apollo/client';

export const GET_DOCKER_CONTAINER_OVERVIEW_FORM = gql`
  query GetDockerContainerOverviewForm($skipCache: Boolean = false) {
    dockerContainerOverviewForm(skipCache: $skipCache) {
      id
      dataSchema
      uiSchema
      data
    }
  }
`;
