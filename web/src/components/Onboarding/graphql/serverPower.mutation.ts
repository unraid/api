import { graphql } from '~/composables/gql';

export const SERVER_REBOOT_MUTATION = graphql(/* GraphQL */ `
  mutation ServerReboot {
    serverPower {
      reboot
    }
  }
`);

export const SERVER_SHUTDOWN_MUTATION = graphql(/* GraphQL */ `
  mutation ServerShutdown {
    serverPower {
      shutdown
    }
  }
`);
