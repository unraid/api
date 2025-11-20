import { gql } from '@apollo/client';

export const DOCKER_STATS_SUBSCRIPTION = gql`
  subscription DockerContainerStats {
    dockerContainerStats {
      id
      cpuPercent
      memUsage
      memPercent
      netIO
      blockIO
    }
  }
`;
