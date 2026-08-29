import { graphql } from '~/composables/gql/gql';

export const updateConnectTunnelPageMutation = graphql(/* GraphQL */ `
  mutation UpdateConnectTunnelPage($input: ConnectTunnelSettingsInput!) {
    updateConnectTunnelSettings(input: $input) {
      signedIn
      certificateManagementEnabled
      tunnelRemoteAccessEnabled
      serverDataReportingEnabled
      tunnelUrl
      status {
        presence
        certificate
        tunnel
        reason
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

export const migrateConnectCertificateMutation = graphql(/* GraphQL */ `
  mutation MigrateConnectCertificate($confirmationToken: String!) {
    migrateConnectCertificate(confirmationToken: $confirmationToken) {
      requestId
      status
      reason
      domain
      fingerprint
      managed
      confirmationToken
    }
  }
`);

export const updateConnectGatewayServicesMutation = graphql(/* GraphQL */ `
  mutation UpdateConnectGatewayServices($input: ConnectGatewaySettingsInput!) {
    updateConnectGatewayServices(input: $input) {
      gateway {
        revision
        available
        pending
        callbackUrl
        services {
          id
          name
          upstream
          tlsServerName
          auth
          providerId
          subjects
          enabled
          url
        }
      }
    }
  }
`);
