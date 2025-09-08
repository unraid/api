import { graphql } from '~/composables/gql/gql';

export const CREATE_API_KEY = graphql(/* GraphQL */ `
  mutation CreateApiKey($input: CreateApiKeyInput!) {
    apiKey {
      create(input: $input) {
        ...ApiKey
      }
    }
  }
`);

export const UPDATE_API_KEY = graphql(/* GraphQL */ `
  mutation UpdateApiKey($input: UpdateApiKeyInput!) {
    apiKey {
      update(input: $input) {
        ...ApiKey
      }
    }
  }
`);

export const DELETE_API_KEY = graphql(/* GraphQL */ `
  mutation DeleteApiKey($input: DeleteApiKeyInput!) {
    apiKey {
      delete(input: $input)
    }
  }
`);
