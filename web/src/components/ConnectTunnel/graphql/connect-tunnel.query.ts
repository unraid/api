import { graphql } from '~/composables/gql/gql';

export const connectTunnelPageQuery = graphql(/* GraphQL */ `
  query ConnectTunnelPage {
    oidcProviders {
      id
      name
    }
    connectTunnelSettings {
      previewMode
      signedIn
      certificateManagementEnabled
      tunnelRemoteAccessEnabled
      serverDataReportingEnabled
      tunnelUrl
      gateway {
        revision
        available
        pending
        callbackUrl
        services {
          id
          name
          upstream
          protocol
          tlsServerName
          auth
          providerId
          subjects
          enabled
          url
        }
      }
      status {
        gateway
        gatewayReason
        routeState
        presence
        certificate
        tunnel
        reason
        tunnelReason
        entitlementState
        entitlement {
          accessState
          reason
          status
          rateMode
          rateBytesPerSecond
          bytesUsed
          quotaBytes
          bytesRemaining
          periodStart
          periodEnd
          updatedAt
        }
      }
      overviewCleanupPending
      overview
      certificateMigration {
        requestId
        status
        reason
        domain
        fingerprint
        managed
        confirmationToken
      }
    }
  }
`);
