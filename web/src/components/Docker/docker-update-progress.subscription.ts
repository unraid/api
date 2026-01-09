import { gql } from '@apollo/client';

export const DOCKER_UPDATE_PROGRESS_SUBSCRIPTION = gql`
  subscription DockerUpdateProgress {
    dockerUpdateProgress {
      containerId
      containerName
      type
      message
      layerId
      overallProgress
      error
      layers {
        layerId
        status
        progress
        current
        total
      }
    }
  }
`;
