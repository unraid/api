import { gql } from '@apollo/client';

export const GET_CONTAINER_TAILSCALE_STATUS = gql`
  query GetContainerTailscaleStatus($id: PrefixedID!) {
    docker {
      container(id: $id) {
        id
        tailscaleStatus(forceRefresh: true) {
          online
          version
          latestVersion
          updateAvailable
          hostname
          dnsName
          relay
          relayName
          tailscaleIps
          primaryRoutes
          isExitNode
          exitNodeStatus {
            online
            tailscaleIps
          }
          webUiUrl
          keyExpiry
          keyExpiryDays
          keyExpired
          backendState
          authUrl
        }
      }
    }
  }
`;
