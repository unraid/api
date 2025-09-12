import { graphql } from '~/composables/gql/gql';

export const GET_CPU_INFO = graphql(/* GraphQL */ `
  query GetCpuInfo {
    info {
      cpu {
        id
        manufacturer
        brand
        vendor
        family
        model
      }
    }
  }
`);

export const CPU_METRICS_SUBSCRIPTION = graphql(/* GraphQL */ `
  subscription CpuMetrics {
    systemMetricsCpu {
      id
      percentTotal
      cpus {
        percentTotal
        percentUser
        percentSystem
      }
    }
  }
`);