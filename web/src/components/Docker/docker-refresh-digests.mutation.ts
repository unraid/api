import { gql } from '@apollo/client';

export const REFRESH_DOCKER_DIGESTS = gql`
  mutation RefreshDockerDigests {
    refreshDockerDigests
  }
`;
